import { JobStatus } from "~~/enums";
import { postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId)
  });
  if (item?.status === JobStatus.QUEUED) {
    await postgresDb
      .update(jobTable)
      .set({
        status: JobStatus.CANCELLED,
        finishDate: new Date().toISOString()
      })
      .where(eq(jobTable.dbid, item.dbid));
  } else if (item?.status === JobStatus.RUNNING) {
    // TODO: kill query in mysql
    const activeQuery = postgresDb.execute(`
          SELECT *
          FROM pg_stat_activity
          WHERE state = 'active' LIMIT 1
      `);
    const result = postgresDb.execute(`
      SELECT pg_cancel_backend(${activeQuery})
      `);
    if (!result) {
      postgresDb.execute(`
        SELECT pg_terminate_backend(${activeQuery})
        `);
    }
    await postgresDb
      .update(jobTable)
      .set({
        status: JobStatus.CANCELLED,
        finishDate: new Date().toISOString()
      })
      .where(eq(jobTable.dbid, item.dbid));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
