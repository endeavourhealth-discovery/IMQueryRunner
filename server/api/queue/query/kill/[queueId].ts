import { JobStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { eq } from "drizzle-orm";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.id, queueId),
  });
  if (item) {
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
        stoppedAt: new Date().toISOString(),
      })
      .where(eq(jobTable.id, item.id));
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
