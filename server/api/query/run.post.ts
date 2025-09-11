import {QueryRunRequest, queryRunRequestSchema} from "~~/models/queryRunRequest.schema";
import {sendMessage} from "~~/server/rabbitmq/rabbitmq";
import {QueueItemStatus} from "~~/enums";
import {IM, type QueryRequest} from "~~/models/AutoGen";
import {imapi} from "~~/server/utils/imapi";
import {postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";

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
  const currentUser = apiAuth.getUser();

  const userId = currentUser.id;
  const userName = currentUser.name;

  console.log("userId", userId);
  console.log("userName", userName);

  const data: QueryRunRequest = await readValidatedBody(event, queryRunRequestSchema.parse);

  const entity = await imapi.getPartialEntity(data.query_id, [IM.DEFINITION]);
  const query = JSON.parse(entity[IM.DEFINITION]);

  const queryRequest: QueryRequest = {
    query: query,
    referenceDate: data.reference_date,
  } as QueryRequest;

  await postgresDb.transaction(async (tx) => {
    const id = await sendMessage(userId, queryRequest);

    tx.insert(queueItem).values({
      id: id,
      queryIri: data.query_id,
      queryName: "",
      queryRequest: queryRequest,
      userId: userId,
      userName: userName,
      queuedAt: data.reference_date,
      status: QueueItemStatus.QUEUED,
    });
  }).catch(error => {
    console.error("Error creating queue item", error);
  });
});
