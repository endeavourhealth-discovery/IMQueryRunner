import Logger from "#shared/logger";
import { JobStatus } from "~~/enums";
import type { JobRequest } from "~~/models/JobRequest";
import type { Job } from "~~/models/job.schema";
import { jobRequestSchema } from "~~/models/jobRequest.schema.ts";
import { createJobEntry, updateJobStatus } from "~~/server/helpers/mysqlHelper";
import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import QueryService from "~~/server/services/QueryService";

import * as z from "zod";

const LOG = Logger("api/queue/job/add");

export default defineEventHandler(async event => {
  const accessToken = await getAccessToken(event);
  const user = await requirePermission(event, "JOB", "EXECUTE");
  const jobRequest = await readValidatedBody(event, jobRequestSchema.parse);
  LOG.debug(`Received job request with tasks: ${jobRequest?.queryRequests?.length}`);
  const queryJob = await createJobEntry(jobRequest, accessToken, user!.id);
  try {
    await sendMessage(user.id, queryJob);
  } catch (err) {
    await updateJobStatus(queryJob.id, JobStatus.ERRORED, user.id, err);
    return;
  }
  LOG.info(`Job queued with id: ${queryJob.id}`);
  return { jobId: queryJob.id };
});
