import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import {pgQueueItemInsert, postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";

export default defineEventHandler(async (event) => {
  const data = pgQueueItemInsert.parse(event);
  await postgresDb
    .insert(queueItem)
    .values(data);
  await sendMessage(data.userId, data);
});
