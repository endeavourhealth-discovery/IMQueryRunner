import { ErrorCode, JobStatus } from "~~/enums";
import { getConnectionId, mysqlDb, pool } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";
import { updateJobStatus } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const connection = await pool.getConnection();

  const items = await mysqlDb
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  const item = items[0];

  if (item?.status === JobStatus.QUEUED) {
    await updateJobStatus(item.id, JobStatus.CANCELLED, item.userId, null);
  } else if (item?.status === JobStatus.RUNNING) {
    await mysqlDb.execute(`KILL QUERY ${await getConnectionId()}`);
    await updateJobStatus(item.id, JobStatus.CANCELLED, item.userId, null);
  } else {
    createError({ statusCode: 404, statusText: ErrorCode.RabbitMQConsumerError, message: "Query queue item not found for id: " + jobId });
  }
  await connection.end();
});
