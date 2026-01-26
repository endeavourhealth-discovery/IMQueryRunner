import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgQueueItemInsert, postgresDb } from "~~/server/db/postgres";
import { queryQueue } from "~~/server/db/postgres/schema";
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
  const queryTask: QueueItem = {
    id: v4(),
    queryIri: queryRequest.query.iri,
    queryName: queryRequest.query.name ?? "",
    queryRequest: queryRequest,
    status: QueueItemStatus.QUEUED,
    userId: user!.id,
    userName: user!.userName,
    queryResult: [],
    queuedAt: new Date().toDateString() as any,
  } as QueueItem;
  await postgresDb
    .insert(queryQueue)
    .values(pgQueueItemInsert.parse(queryTask));
  await sendMessage(user!.id, queryTask);
});
