import Logger from "#shared/logger";
import { ErrorCode, JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";

import { IMQType } from "@endeavour/vue-library/enums";
import { type QueryRequest } from "@endeavour/vue-library/models";

import { Connection } from "rabbitmq-client";

import { indicatorResultTable, queryResultSetTable } from "../db/mysql/schema";
import { createIndicatorResultEntry, createResultSetEntry, getJobById, updateJobStatus, updateWithEndTime } from "../helpers/mysqlHelper";
import { createExecutionContext, executeQuery, getIndicatorSubQueryRequests, getValidatedSQL } from "../utils/executeQuery";

const LOG = Logger("server/rabbitmq");

const rabbit = new Connection(process.env.RABBITMQ_URL);
// The client reconnects on its own; log so an outage is visible rather than silent
rabbit.on("error", (err: Error) => LOG.error({ err }, "Connection error"));
rabbit.on("connection", () => LOG.info("Connected"));

/** The worker calls IMAPI as this application (client credentials), not as the user who queued the job. */
async function getWorkerAccessToken() {
  try {
    return await getMachineAccessToken();
  } catch (err: unknown) {
    if (isError(err)) throw createError({ statusCode: 401, statusMessage: ErrorCode.AuthorisationError, message: err.message });
    else throw createError({ statusCode: 500, statusMessage: ErrorCode.InternalServerError, message: err instanceof Error ? err.message : "Unknown error" });
  }
}

const sub = rabbit.createConsumer(
  {
    queue: "query.execute",
    queueOptions: { durable: true },
    qos: { prefetchCount: 1 },
    concurrency: 1,
    requeue: false,
    exchanges: [{ exchange: "query_runner", type: "topic", durable: true }],
    queueBindings: [
      {
        exchange: "query_runner",
        routingKey: "query.execute.#",
        queue: "query.execute"
      }
    ]
  },
  async (msg: any) => {
    let job: Job | undefined;

    try {
      const accessToken = await getWorkerAccessToken();
      job = await getJobById(Number(msg.messageId!));

      if (job.status === JobStatus.CANCELLED) {
        LOG.warn(`Job ${job.id} is cancelled. Query rejected.`);
        return;
      }

      await updateJobStatus(job.id, JobStatus.RUNNING, job.userId);

      // Shared by every query in this job so a sub query used more than once is only looked up once
      const ctx = createExecutionContext();

      for (const queryRequest of job.queryRequests) {
        const sql = await getValidatedSQL(queryRequest, accessToken, job.id);
        const queryResultSet = await createResultSetEntry(queryRequest, job);

        const queriesToRun: { sql: string; queryRequest: QueryRequest }[] = [];
        let indicatorId: number | null = null;

        if (queryRequest.query.queryType === IMQType.INDICATOR) {
          indicatorId = await createIndicatorResultEntry(queryRequest, queryResultSet, hashQueryRequest(queryRequest));

          queriesToRun.push(...(await getIndicatorSubQueryRequests(accessToken, queryRequest, job.id, ctx)));
        } else {
          queriesToRun.push({ sql, queryRequest });
        }

        LOG.debug(`Queries to run: ${queriesToRun.length}`);

        for (const item of queriesToRun) {
          await executeQuery(accessToken, item.sql, item.queryRequest, queryResultSet, ctx);
        }

        await updateWithEndTime(queryResultSet.id!, queryResultSetTable);

        if (indicatorId) {
          await updateWithEndTime(indicatorId, indicatorResultTable);
        }
      }

      await updateJobStatus(job.id, JobStatus.COMPLETED, job.userId);
    } catch (err: unknown) {
      LOG.error({ err, messageId: msg?.messageId }, "Consumer failed for message");

      if (job?.id) {
        try {
          await updateJobStatus(job.id, JobStatus.ERRORED, job.userId, err);
        } catch (statusErr) {
          LOG.error({ err: statusErr, jobId: job.id }, "Failed to update job status to ERRORED");
        }
      }
      throw createError({ statusCode: 500, statusMessage: ErrorCode.RabbitMQConsumerError, message: "[RabbitMQ] consumer error", cause: err });
    }
  }
);
sub.on("error", (err: Error) => {
  LOG.error({ err }, "Queue error");
});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic", durable: true }]
});

export async function sendMessage(userId: string, message: Job) {
  await pub.send(
    {
      messageId: "" + message.id,
      exchange: "query_runner",
      routingKey: "query.execute." + userId,
      durable: true
    },
    JSON.stringify(message)
  );
  return message.id;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
