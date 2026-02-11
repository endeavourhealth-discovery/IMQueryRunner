import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { IM, RDFS } from "~~/models/AutoGen";
import z from "zod";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models";

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
          type: "string",
        },
      } as const,
    ],
    requestBody: {
      description: "Credentials",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              query_id: {
                type: "string",
                description: "IRI of the query to run",
              },
              reference_date: {
                type: "string",
                description: "The reference date to run the query against",
              },
            },
            required: ["query_id", "reference_date"] as const,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");

  const currentUser = await globalThis.apiGuard.getUser();

  const userId = currentUser!.id;
  const userName = currentUser!.userName;

  const data = await readValidatedBody(event, queryRunRequestSchema.parse);

  const entity = await imapi.getPartialEntity(sessionId!, data.query_id, [
    RDFS.LABEL,
    IM.DEFINITION,
  ]);
  const query = JSON.parse(entity[IM.DEFINITION]);

  const job = {
    queryRequest: {
      query: query,
      referenceDate: data.reference_date,
    },
  } as Job;

  return await postgresDb
    .transaction(async (tx) => {
      const id = await sendMessage(userId, job);

      const qi = pgJobInsert.parse({
        id: id,
        queryIri: data.query_id,
        queryName: entity[RDFS.LABEL],
        queryRequest: job.queryRequest,
        userId: userId,
        userName: userName,
        queuedAt: data.reference_date,
        status: JobStatus.QUEUED,
      });
      await tx.insert(jobTable).values(qi);

      return { queueId: id };
    })
    .catch((error) => {
      console.error("Error creating queue item", error);
    });
});
