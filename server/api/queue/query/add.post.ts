import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import {pgQueueItemInsert, postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {type QueueItem, queueItemSchema} from "~~/models/queryItem.schema";

export default defineEventHandler(async (event) => {
  const userId = event.context.auth;
  const data: QueueItem  = await readValidatedBody(event, queueItemSchema.parse);
  // const data = pgQueueItemInsert.parse(event);

  await postgresDb
    .insert(queueItem)
    .values(pgQueueItemInsert.parse(data));
  await sendMessage(userId, data);
});
