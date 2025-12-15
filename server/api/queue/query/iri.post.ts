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
  RDFS,
  IM,
} from "~~/models/AutoGen";
import { QueueItemStatus } from "~~/enums";
import type { QueueItem } from "~~/models/queryItem.schema";
import { v4 } from "uuid";
import z from "zod";

export const queryRunRequestSchema = z.object({
  query_id: z.string(),
  reference_date: z.string(),
});

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
  const data = await readValidatedBody(event, queryRunRequestSchema.parse);

  const entity = await imapi.getPartialEntity(data.query_id, [
    RDFS.LABEL,
    IM.DEFINITION,
  ]);
  const query = JSON.parse(entity[IM.DEFINITION]);
  const queryRequest = {
    query: query,
    referenceDate: data.reference_date,
  };

  return await postgresDb
    .transaction(async (tx) => {
      const id = await sendMessage(user!.id, queryRequest);
      const qi = insertQueueItemSchema.parse({
        id: id,
        queryIri: data.query_id,
        queryName: entity[RDFS.LABEL],
        queryRequest: queryRequest,
        userId: user!.id,
        userName: user!.userName,
        queuedAt: data.reference_date,
        status: QueueItemStatus.QUEUED,
      });
      await tx.insert(queueItem).values(qi);
    })
    .catch((error) => {
      console.error("Error creating queue item", error);
    });
});
