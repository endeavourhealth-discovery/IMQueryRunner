import { JobStatus } from "~~/enums";
import type { JobRequest } from "~~/models/JobRequest";
import type { Job } from "~~/models/job.schema";
import { createJobEntry, updateJobStatus } from "~~/server/helpers/mysqlHelper";
import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import QueryService from "~~/server/services/QueryService";

export default defineEventHandler(async event => {
  const sessionId = getCookie(event, "session_id");
  const user = await globalThis.apiGuard.getUser(event);
  const jobRequest: JobRequest = await readBody(event);
  console.log("Received job request with tasks:", jobRequest?.queryRequests?.length);
  const queryJob = await createJobEntry(jobRequest, sessionId!, user!.id);
  try {
    await sendMessage(user.id, queryJob);
  } catch (err) {
    await updateJobStatus(queryJob.id, JobStatus.ERRORED, user.id, err);
    return;
  }
  console.log("Job queued with id:", queryJob.id);
  return { jobId: queryJob.id };
});
