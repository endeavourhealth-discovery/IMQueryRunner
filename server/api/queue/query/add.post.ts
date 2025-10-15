import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgQueueItemInsert, postgresDb } from "~~/server/db/postgres";
import { queueItem } from "~~/server/db/postgres/schema";
import { type QueryRequest, DatabaseOption } from "~~/models/AutoGen";
import { QueueItemStatus } from "~~/enums";
import type { QueueItem } from "~~/models/queryItem.schema";
import { v4 } from "uuid";

export default defineEventHandler(async (event) => {
  globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  const queryRequest: QueryRequest = await readBody(event);

  if (!queryRequest.language) queryRequest.language = DatabaseOption.MYSQL;
  try {
    await imapi.getQuerySql(queryRequest);
  } catch (e: unknown) {
    throw createError("Unable to convert query to SQL");
  }
  const queueQuery: QueueItem = {
    id: v4(),
    queryIri: queryRequest.query.iri,
    queryName: queryRequest.query.name,
    queryRequest: queryRequest,
    status: QueueItemStatus.QUEUED,
    userId: user!.id,
    username: user!.userName,
    queryResult: [],
    queuedAt: new Date(),
  } as QueueItem;
  await postgresDb
    .insert(queueItem)
    .values(pgQueueItemInsert.parse(queueQuery));
  await sendMessage(user!.id, queueQuery);
});
