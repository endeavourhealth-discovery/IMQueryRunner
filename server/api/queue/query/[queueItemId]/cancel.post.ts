import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { queueItem } from "~~/server/db/postgres/schema";

const paramSchema = z.object({
  queueItemId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueItemId } = await getValidatedRouterParams(
    event,
    paramSchema.parse
  );
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueItemId),
  });
  if (item?.status === QueueItemStatus.QUEUED) {
    await postgresDb
      .update(queueItem)
      .set({
        status: QueueItemStatus.CANCELLED,
        killedAt: new Date().toISOString(),
      })
      .where(eq(queueItem.id, item.id));
  } else if (item?.status === QueueItemStatus.RUNNING) {
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
      .update(queueItem)
      .set({
        status: QueueItemStatus.CANCELLED,
        killedAt: new Date().toISOString(),
      })
      .where(eq(queueItem.id, item.id));
  } else {
    createError("Query queue item not found for id: " + queueItemId);
  }
});
