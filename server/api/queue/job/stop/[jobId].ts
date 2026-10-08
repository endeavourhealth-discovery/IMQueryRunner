import { ErrorCode, JobStatus } from "~~/enums";
import { mysqlDb, withConnectionId } from "~~/server/db/mysql";
import { getJobForUser, updateJobStatus } from "~~/server/helpers/mysqlHelper";

import * as z from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await getJobForUser(jobId, user.id);

  if (job.status === JobStatus.QUEUED) {
    await updateJobStatus(job.id, JobStatus.CANCELLED, job.userId, null);
  } else if (job.status === JobStatus.RUNNING) {
    await withConnectionId(threadId => mysqlDb.execute(`KILL QUERY ${threadId}`));
    await updateJobStatus(job.id, JobStatus.CANCELLED, job.userId, null);
  } else {
    createError({ statusCode: 404, statusText: ErrorCode.RabbitMQConsumerError, message: "Query queue item not found for id: " + jobId });
  }
});
