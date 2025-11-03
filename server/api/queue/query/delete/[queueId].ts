import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { queueItem } from "~~/server/db/postgres/schema";
import { Action, Resource } from "~~/models/AutoGen";

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
  if (item) {
    await postgresDb.delete(queueItem).where(eq(queueItem.id, item.id));
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
