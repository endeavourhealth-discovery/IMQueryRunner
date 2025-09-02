import { v4 as uuidv4 } from 'uuid';
import {PrismaClient} from "@@/prisma/generated/postgres";
import {oathTokenRequestSchema, type OauthTokenRequest} from "~~/models/oauth.token.request.schema";
import {authenticator} from "~~/server/services/auth/authenticator";
import {QueryRunRequest, queryRunRequestSchema} from "~~/models/queryRunRequest.schema";
import {sendMessage} from "~~/server/rabbitmq/rabbitmq";
import {ZodUUID} from "zod";
import {QueueItemStatus} from "~~/enums";
import {QueryRequest} from "~~/models/AutoGen";

const prisma = new PrismaClient();

defineRouteMeta({
  openAPI: {
    tags: ["auth", "smartlife"],
    description: "Get authentication token",
    requestBody: {
      description: "Credentials",
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {
              "client_id": {type: "string", description: "Client ID"},
              "client_secret": {type: "string", description: "Client Secret"},
            },
            required: ["client_id", "client_secret"] as const,
          }
        },
      }
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                "access_token": {type: "string"},
                "token_type": {type: "string"},
                "expires_in": {type: "number"}
              }
            }
          }
        }
      }
    }
  },
});

export default defineEventHandler(async (event) => {
  console.log("query run");
  const data: QueryRunRequest = await readValidatedBody(event, queryRunRequestSchema.parse);
  const id = uuidv4();
  const request: QueryRequest = {

  } as QueryRequest;

  await prisma.queueItem.create({
    data: {
      id: id,
      query_iri: data.query_id,
      query_request: JSON.stringify(request),
      user_id: authenticator.getUserId(),
      user_name: authenticator.getUserName(),
      queued_at: new Date(),
      status: QueueItemStatus.QUEUED,
      pid: -1,
      started_at: null,
      killed_at: null,
      finished_at: null,
      error: null,
    },
  });
  await sendMessage(authenticator.getUserId(), data);
});
