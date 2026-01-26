import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgQueueItemInsert, postgresDb } from "~~/server/db/postgres";
import { queryQueue } from "~~/server/db/postgres/schema";

export default defineEventHandler(async (event) => {
  const data = pgQueueItemInsert.parse(event);
  await postgresDb.insert(queryQueue).values(data);
  await sendMessage(data.userId, data);
});
