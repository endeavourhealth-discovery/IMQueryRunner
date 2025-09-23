import {sendMessage} from "~~/server/rabbitmq/rabbitmq";
import {QueueItemStatus} from "~~/enums";
import {imapi} from "~~/server/utils/imapi";
import {pgQueueItemInsert, postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {IM, RDFS} from "~~/models/AutoGen";
import z from "zod";

export const queryRunRequestSchema = z.object({
  query_id: z.string(),
  reference_date: z.string(),
});


defineRouteMeta({
  openAPI: {
    tags: ["auth", "smartlife"],
    description: "Get authentication token",
    parameters: [
      {
        name: "authorization",
        in: "header",
        description: "Bearer token",
        required: true,
        schema: {
          type: "string"
        }
      } as const
    ],
    requestBody: {
      description: "Credentials",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              "query_id": {type: "string", description: "IRI of the query to run"},
              "reference_date": {type: "string", description: "The reference date to run the query against"},
            },
            required: ["query_id", "reference_date"] as const,
          }
        },
      }
    },
    responses: {
      200: {
        description: "OK",
      }
    }
  },
});

export default defineEventHandler(async (event) => {
  console.log("query run");
  const currentUser = globalThis.authenticator.getUser(event);

  const userId = currentUser!.id!;
  const userName = currentUser!.name!;

  console.log("userId", userId);
  console.log("userName", userName);

  const data = await readValidatedBody(event, queryRunRequestSchema.parse);

  const entity = await imapi.getPartialEntity(data.query_id, [RDFS.LABEL, IM.DEFINITION]);
  const query = JSON.parse(entity[IM.DEFINITION]);

  const queryRequest = {
    query: query,
    referenceDate: data.reference_date,
  };

  return await postgresDb.transaction(async (tx) => {
    const id = await sendMessage(userId, queryRequest);

    const qi = pgQueueItemInsert.parse(
      {
        id: id,
        queryIri: data.query_id,
        queryName: entity[RDFS.LABEL],
        queryRequest: queryRequest,
        userId: userId,
        userName: userName,
        queuedAt: data.reference_date,
        status: QueueItemStatus.QUEUED,
      }
    )
    await tx.insert(queueItem).values(qi)

    console.log("Added query to the queue [", id, "]");

    return { queueId: id };
  }).catch(error => {
    console.error("Error creating queue item", error);
  });
});