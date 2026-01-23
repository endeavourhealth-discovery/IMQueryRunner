import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { queryQueue } from "~~/server/db/postgres/schema";
import { eq } from "drizzle-orm";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.queryQueue.findFirst({
    where: eq(queryQueue.id, queueId),
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
      .update(queryQueue)
      .set({
        status: QueueItemStatus.CANCELLED,
        killedAt: new Date().toISOString(),
      })
      .where(eq(queryQueue.id, item.id));
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
