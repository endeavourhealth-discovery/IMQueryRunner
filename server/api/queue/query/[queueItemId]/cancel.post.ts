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
  if (item) {
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
