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
  return await postgresDb
    .transaction(async (tx) => {
      const id = await sendMessage(user!.id, queryRequest);
      const qi = insertQueueItemSchema.parse({
        id: id,
        queryIri: queryRequest.query.iri,
        queryName: queryRequest.query.name,
        queryRequest: queryRequest,
        userId: user!.id,
        userName: user!.userName,
        queuedAt: new Date(),
        status: QueueItemStatus.QUEUED,
      });
      await tx.insert(queueItem).values(qi);

      return { queueId: id };
    })
    .catch((error) => {
      console.error("Error creating queue item", error);
    });
});
