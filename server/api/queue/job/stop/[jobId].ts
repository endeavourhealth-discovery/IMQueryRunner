import { JobStatus } from "~~/enums";
import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";
import { getNow } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await mysqlDb.query.jobTable.findFirst({
    where: eq(jobTable.id, Number(jobId)),
  });
  const now = getNow();

  if (item?.status === JobStatus.QUEUED) {
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.CANCELLED,
        finishDate: now,
      })
      .where(eq(jobTable.id, item.id));
  } else if (item?.status === JobStatus.RUNNING) {
    // TODO: kill query in mysql
    const activeQuery = mysqlDb.execute(`
          SELECT *
          FROM pg_stat_activity
          WHERE state = 'active' LIMIT 1
      `);
    const result = mysqlDb.execute(`
      SELECT pg_cancel_backend(${activeQuery})
      `);
    if (!result) {
      mysqlDb.execute(`
        SELECT pg_terminate_backend(${activeQuery})
        `);
    }
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.CANCELLED,
        finishDate: now,
      })
      .where(eq(jobTable.id, item.id));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
