import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  insertQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { QueueItemStatus } from "~~/enums";

const paramSchema = z.object({
  queueItemId: z.string(),
});

export default defineEventHandler(async (event) => {
  globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  if (!user) {
    throw createError("Unauthorized");
  }

  const { queueItemId } = await getValidatedRouterParams(
    event,
    paramSchema.parse
  );
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueItemId),
  });
  const parsed = insertQueueItemSchema.parse(item);
  return await postgresDb
    .transaction(async (tx) => {
      const id = await sendMessage(user!.id, parsed);
      parsed.id = id;
      parsed.queuedAt = new Date().toString();
      parsed.status = QueueItemStatus.QUEUED;
      parsed.error = null;
      parsed.finishedAt = null;
      parsed.killedAt = null;
      parsed.startedAt = null;
      await tx.insert(queueItem).values(parsed);
    })
    .catch((error) => {
      console.error("Error requeuing item", error);
    });
});
