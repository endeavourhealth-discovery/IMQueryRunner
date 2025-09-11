import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import {type QueueItem, queueItemSchema} from "~~/models/queryItem.schema";
import {postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";

export default defineEventHandler(async (event) => {
  const data: QueueItem = await readValidatedBody(event, queueItemSchema.parse);
  const userId = event.context.auth;
  await postgresDb
    .insert(queueItem)
    .values({
      id: data.id,
      queryIri: data.queryIri,
      queryName: data.queryName,
      queryRequest: JSON.stringify(data.queryRequest),
      userId: data.userId,
      userName: data.username,
      queuedAt: new Date().toISOString(),
      status: data.status,
      pid: data.pid,
    });
  await sendMessage(userId, data);
});
