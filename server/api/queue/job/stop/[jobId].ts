import { JobStatus } from "~~/enums";
import { connectionId } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";
import * as schema from "~~/server/db/mysql/schema";
import { updateJobStatus } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import { MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const connection = await mysql.createConnection(process.env.COMPASS_URL as string);

  const db: MySql2Database<typeof schema> = drizzle({
    client: connection,
    schema,
    mode: "default"
  });

  const items = await db
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  const item = items[0];

  if (item?.status === JobStatus.QUEUED) {
    await updateJobStatus(item.id, JobStatus.CANCELLED, null);
  } else if (item?.status === JobStatus.RUNNING) {
    await db.execute(`KILL QUERY ${connectionId}`);
    await updateJobStatus(item.id, JobStatus.CANCELLED, null);
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
  await connection.end();
});
