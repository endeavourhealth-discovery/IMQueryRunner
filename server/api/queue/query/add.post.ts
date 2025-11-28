import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  insertQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import {
  type QueryRequest,
  DatabaseOption,
  Resource,
  Action,
} from "~~/models/AutoGen";
import { QueueItemStatus } from "~~/enums";
import type { QueueItem } from "~~/models/queryItem.schema";
import { v4 } from "uuid";

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
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
    .values(insertQueueItemSchema.parse(queueQuery));
  await sendMessage(user!.id, queueQuery);
});
