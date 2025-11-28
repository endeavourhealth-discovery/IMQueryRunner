import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  selectQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import { eq } from "drizzle-orm";
import { Action, Resource } from "~~/models/AutoGen";
import { cloneDeep } from "lodash-es";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueId),
  });
  const parsed = selectQueueItemSchema.parse(item);
  if (parsed) {
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
      .where(eq(queueItem.id, parsed.id));
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
