import { ErrorCode, JobStatus } from "~~/enums";
import { getConnectionId, mysqlDb, pool } from "~~/server/db/mysql";
import { getJobForUser, updateJobStatus } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  // Check ownership before taking a pool connection so a 404 cannot leak one
  const job = await getJobForUser(jobId, user.id);

  const connection = await pool.getConnection();

  if (job.status === JobStatus.QUEUED) {
    await updateJobStatus(job.id, JobStatus.CANCELLED, job.userId, null);
  } else if (job.status === JobStatus.RUNNING) {
    await mysqlDb.execute(`KILL QUERY ${await getConnectionId()}`);
    await updateJobStatus(job.id, JobStatus.CANCELLED, job.userId, null);
  } else {
    createError({ statusCode: 404, statusText: ErrorCode.RabbitMQConsumerError, message: "Query queue item not found for id: " + jobId });
  }
  await connection.end();
});
