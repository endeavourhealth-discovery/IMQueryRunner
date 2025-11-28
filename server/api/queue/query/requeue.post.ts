import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  insertQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import { Action, Resource } from "~~/models/AutoGen";

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
  const data = insertQueueItemSchema.parse(event);
  await postgresDb.insert(queueItem).values(data);
  await sendMessage(data.userId, data);
});
