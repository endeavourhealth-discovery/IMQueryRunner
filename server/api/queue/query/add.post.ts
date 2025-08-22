import { PrismaClient } from "@@/prisma/generated/postgres";
import { QueueItem } from "@@/models";
import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { queueItemSchema } from "~~/server/schemas/queryItem.schema";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.auth;
  const data = await readValidatedBody(event, queueItemSchema.parse);
  await prisma.queueItem.create({
    data: {
      id: data.id,
      query_iri: data.queryIri,
      query_name: data.queryName,
      query_request: JSON.stringify(data.queryRequest),
      user_id: data.userId,
      user_name: data.username,
      queued_at: new Date(),
      status: data.status,
      pid: data.pid,
      started_at: null,
      killed_at: null,
      finished_at: null,
      error: null,
    },
  });
  await sendMessage(userId, data);
});
