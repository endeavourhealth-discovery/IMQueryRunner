import Logger from "#shared/logger";
import { JobStatus } from "~~/enums";
import { jobRequestSchema } from "~~/models/jobRequest.schema.ts";
import { closeOpenQueryResults, createJobEntry, planJob, updateJobStatus } from "~~/server/helpers/mysqlHelper";
import { sendJobRequests } from "~~/server/rabbitmq/rabbitmq";

const LOG = Logger("api/queue/job/add");

export default defineEventHandler(async event => {
  const accessToken = await getAccessToken(event);
  const user = await requirePermission(event, "JOB", "EXECUTE");
  const jobRequest = await readValidatedBody(event, jobRequestSchema.parse);
  LOG.debug(`Received job request with tasks: ${jobRequest?.queryRequests?.length}`);
  const queryJob = await createJobEntry(jobRequest, accessToken, user!.id);
  try {
    const planned = await planJob(queryJob);
    await sendJobRequests(user.id, queryJob.id, planned);
  } catch (err) {
    await closeOpenQueryResults(queryJob.id).catch(closeErr => LOG.error({ err: closeErr, jobId: queryJob.id }, "Failed to close open query results"));
    await updateJobStatus(queryJob.id, JobStatus.ERRORED, user.id, err);
    return;
  }
  LOG.info(`Job queued with id: ${queryJob.id} (${queryJob.queryRequests.length} requests)`);
  return { jobId: queryJob.id };
});
