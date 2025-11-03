import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgQueueItemInsert, postgresDb } from "~~/server/db/postgres";
import { queueItem } from "~~/server/db/postgres/schema";
import { Action, Resource } from "~~/models/AutoGen";

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
  const data = pgQueueItemInsert.parse(event);
  await postgresDb.insert(queueItem).values(data);
  await sendMessage(data.userId, data);
});
