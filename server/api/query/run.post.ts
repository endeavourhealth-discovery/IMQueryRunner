import { v4 as uuidv4 } from 'uuid';
import {PrismaClient} from "@@/prisma/generated/postgres";
import {QueryRunRequest, queryRunRequestSchema} from "~~/models/queryRunRequest.schema";
import {sendMessage} from "~~/server/rabbitmq/rabbitmq";
import {QueueItemStatus} from "~~/enums";
import {IM, type QueryRequest} from "~~/models/AutoGen";
import {imapi} from "~~/server/utils/imapi";

const prisma = new PrismaClient();

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

  const token = event.headers.get("authorization")!;
  const userId = authenticator.getUserId(token);
  const userName = authenticator.getUserName(token);
  const data: QueryRunRequest = await readValidatedBody(event, queryRunRequestSchema.parse);

  const entity = await imapi.getPartialEntity(data.query_id, [IM.DEFINITION]);
  const query = JSON.parse(entity[IM.DEFINITION]);

  const queryRequest: QueryRequest = {
    query: query,
    referenceDate: data.reference_date,
  } as QueryRequest;

  await prisma.$transaction(async (tx) => {
    const id = await sendMessage(userId, queryRequest);

    await tx.queueItem.create({
      data: {
        id: id,
        query_iri: data.query_id,
        query_name: "",
        query_request: JSON.stringify(queryRequest),
        user_id: userId,
        user_name: userName,
        queued_at: new Date(data.reference_date),
        status: QueueItemStatus.QUEUED,
        pid: -1,
        started_at: null,
        killed_at: null,
        finished_at: null,
        error: null,
      },
    })
      .catch(error => {
        console.error("Error creating queue item", error);
      });
  })
});
