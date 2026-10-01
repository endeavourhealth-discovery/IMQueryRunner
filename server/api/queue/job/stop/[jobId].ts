import { ErrorCode, JobStatus } from "~~/enums";
import { getConnectionId, mysqlDb, pool } from "~~/server/db/mysql";
import { getJobById, updateJobStatus } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.number()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const connection = await pool.getConnection();

  const job = await getJobById(jobId);

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
