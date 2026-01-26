import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";

export default defineEventHandler(async (event) => {
  const data = pgJobInsert.parse(event);
  await postgresDb.insert(jobTable).values(data);
  await sendMessage(data.userId, data);
});
