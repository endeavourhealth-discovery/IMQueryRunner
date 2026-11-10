import Logger from "#shared/logger";
import { ErrorCode, JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import { type PlannedQueryRequest, jobQueueMessageSchema } from "~~/models/jobQueueMessage.schema";

import { type QueryRequest } from "@endeavour/vue-library/models";

import { isError } from "h3";

import { indicatorResultTable, queryResultSetTable } from "../db/mysql/schema";
import {
  closeOpenQueryResults,
  findJobById,
  getResultSetForJob,
  hasOpenResultSets,
  planJob,
  updateJobStatus,
  updateWithEndTime,
  updateWithStartTime
} from "../helpers/mysqlHelper";
import {
  type ExecutionContext,
  createExecutionContext,
  executeQuery,
  getIndicatorSubQueryRequests,
  getValidatedSQL,
  prepareIndicatorSubQueries
} from "../utils/executeQuery";
import { getMachineAccessToken } from "../utils/machineToken";

const LOG = Logger("server/rabbitmq/jobConsumer");

/** Jobs whose context is kept at once. Only reached if jobs stop without their last message being handled. */
const MAX_JOB_CONTEXTS = 10000;

/**
 * The execution context of each job that is part way through, so the IMAPI lookups made for one of its requests are reused by the
 * job's later requests, which arrive as separate messages. Results are shared through the database (see `planJob`); this only saves
 * repeating lookups. Dropped as soon as the job finishes, fails or is skipped, so a later job still sees the query definitions as they are then.
 */
const jobContexts = new Map<number, ExecutionContext>();

export function getJobContext(jobId: number): ExecutionContext {
  let ctx = jobContexts.get(jobId);
  if (!ctx) {
    // Maps iterate in insertion order, so the first key is the oldest
    if (jobContexts.size >= MAX_JOB_CONTEXTS) jobContexts.delete(jobContexts.keys().next().value!);
    ctx = createExecutionContext();
    jobContexts.set(jobId, ctx);
  }
  return ctx;
}

export function releaseJobContext(jobId: number) {
  jobContexts.delete(jobId);
}

/** The worker calls IMAPI as this application (client credentials), not as the user who queued the job. */
async function getWorkerAccessToken() {
  try {
    return await getMachineAccessToken();
  } catch (err: unknown) {
    if (isError(err)) throw createError({ statusCode: 401, statusMessage: ErrorCode.AuthorisationError, message: err.message });
    else throw createError({ statusCode: 500, statusMessage: ErrorCode.InternalServerError, message: err instanceof Error ? err.message : "Unknown error" });
  }
}

/** Runs one request of a job in the result set planned for it. Sub queries already run by the job's other requests are reused, not run again. */
export async function runPlannedRequest(accessToken: string, job: Job, planned: PlannedQueryRequest, ctx: ExecutionContext) {
  const { queryRequest, indicatorResultId } = planned;
  const queryResultSet = await getResultSetForJob(planned.queryResultSetId, job);

  await updateWithStartTime(queryResultSet.id!, queryResultSetTable);
  if (indicatorResultId) await updateWithStartTime(indicatorResultId, indicatorResultTable);

  const sql = await getValidatedSQL(queryRequest, accessToken, job.id);

  const queriesToRun: { sql: string; queryRequest: QueryRequest }[] = [];

  if (indicatorResultId) {
    queriesToRun.push(...(await getIndicatorSubQueryRequests(accessToken, queryRequest, job.id, ctx)));
    await prepareIndicatorSubQueries(
      accessToken,
      queryRequest,
      queriesToRun.map(item => item.queryRequest),
      queryResultSet,
      indicatorResultId,
      ctx
    );
  } else {
    queriesToRun.push({ sql, queryRequest });
  }

  LOG.debug(`Queries to run: ${queriesToRun.length}`);

  for (const item of queriesToRun) {
    await executeQuery(accessToken, item.sql, item.queryRequest, queryResultSet, ctx);
  }

  await updateWithEndTime(queryResultSet.id!, queryResultSetTable);
  if (indicatorResultId) await updateWithEndTime(indicatorResultId, indicatorResultTable);
}

/**
 * Handles one message from the queue. A message is normally one request of a job; a message from before jobs were split (the whole
 * job, sent as JSON text with the job id as its message id) is planned and run in full, so jobs queued across an upgrade still run.
 *
 * The job's status spans its messages: the first one to run marks it RUNNING, the one that leaves no result set open marks it
 * COMPLETED, and a failure marks it ERRORED and cancels what has not run, so the job's remaining messages are skipped.
 */
export async function handleJobMessage(msg: { body: unknown; messageId?: string }) {
  const body: any = typeof msg.body === "string" ? JSON.parse(msg.body) : msg.body;
  const message = jobQueueMessageSchema.safeParse(body);
  const isLegacy = !message.success && Array.isArray(body?.queryRequests);
  if (!message.success && !isLegacy) {
    LOG.error({ err: message.error, messageId: msg.messageId }, "Unrecognised queue message. Dropped.");
    return;
  }
  const jobId = message.success ? message.data.jobId : Number(msg.messageId);

  let job: Job | undefined;
  try {
    job = await findJobById(jobId);
    if (!job) {
      LOG.warn(`Job ${jobId} no longer exists. Message dropped.`);
      releaseJobContext(jobId);
      return;
    }

    if (job.status !== JobStatus.QUEUED && job.status !== JobStatus.RUNNING) {
      LOG.warn(`Job ${job.id} is ${job.status}. Request ${message.data?.index ?? "(whole job)"} skipped.`);
      releaseJobContext(job.id);
      // A job cancelled between its requests: whatever had not run yet is shown as cancelled
      if (job.status === JobStatus.CANCELLED) await closeOpenQueryResults(job.id);
      return;
    }

    if (job.status === JobStatus.QUEUED) await updateJobStatus(job.id, JobStatus.RUNNING, job.userId);

    const accessToken = await getWorkerAccessToken();
    const ctx = getJobContext(job.id);
    const planned = message.success ? [message.data] : await planJob(job);
    if (message.success) LOG.debug(`Job ${job.id}: running request ${message.data.index + 1} of ${message.data.total}`);

    for (const item of planned) {
      await runPlannedRequest(accessToken, job, item, ctx);
    }

    if (!(await hasOpenResultSets(job.id))) {
      releaseJobContext(job.id);
      await updateJobStatus(job.id, JobStatus.COMPLETED, job.userId);
    }
  } catch (err: unknown) {
    LOG.error({ err, messageId: msg.messageId, jobId }, "Consumer failed for message");
    releaseJobContext(jobId);

    if (job?.id) {
      // First, so the page sees the final query statuses when it reloads for the job's status. Must not stop the job being marked as failed.
      await closeOpenQueryResults(job.id).catch(statusErr => LOG.error({ err: statusErr, jobId: job?.id }, "Failed to close open query results"));
      try {
        await updateJobStatus(job.id, JobStatus.ERRORED, job.userId, err);
      } catch (statusErr) {
        LOG.error({ err: statusErr, jobId: job.id }, "Failed to update job status to ERRORED");
      }
    }
    throw createError({ statusCode: 500, statusMessage: ErrorCode.RabbitMQConsumerError, message: "[RabbitMQ] consumer error", cause: err });
  }
}
