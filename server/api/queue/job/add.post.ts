import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import type { JobRequest } from "~~/models/JobRequest";
import { createJobEntry, updateJobStatus } from "~~/server/helpers/mysqlHelper";

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  const user = await globalThis.apiGuard.getUser(event);
  const jobRequest: JobRequest = await readBody(event);
  console.log(
    "Received job request with tasks:",
    jobRequest?.queryRequests?.length,
  );
  const queryJob = await createJobEntry(jobRequest, sessionId!, user!.id);
  try {
    await sendMessage(user!.id, queryJob);
  } catch (err) {
    await updateJobStatus(
      queryJob.id!,
      JobStatus.ERRORED,
      "Failed to queue job for execution: " + String(err),
    );
    return;
  }
  console.log("Job queued with id:", queryJob.id);
  return { jobId: queryJob.id };
});
