import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgQueueItemInsert, postgresDb } from "~~/server/db/postgres";
import { queueItem } from "~~/server/db/postgres/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { QueryRequest } from "~~/models/AutoGen";
import { v4 } from "uuid";
import { QueueItemStatus } from "~~/enums";
import { QueueItem } from "~~/models/queryItem.schema";

const paramSchema = z.object({
  queueItemId: z.string(),
});

export default defineEventHandler(async (event) => {
  globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  if (!user) {
    throw createError("Unauthorized");
  }

  const { queueItemId } = await getValidatedRouterParams(
    event,
    paramSchema.parse
  );
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueItemId),
  });

  if (!item) {
    throw createError("Query queue item not found for id: " + queueItemId);
  }
  const queryRequest: QueryRequest = item.queryRequest as QueryRequest;
  const queueQuery: QueueItem = {
    id: v4(),
    queryIri: queryRequest.query.iri,
    queryName: queryRequest.query.name,
    queryRequest: queryRequest,
    status: QueueItemStatus.QUEUED,
    userId: user.id,
    username: user.userName,
    queryResult: [],
    queuedAt: new Date(),
  } as QueueItem;
  await postgresDb
    .insert(queueItem)
    .values(pgQueueItemInsert.parse(queueQuery));
  await sendMessage(user.id, queueQuery);
});
