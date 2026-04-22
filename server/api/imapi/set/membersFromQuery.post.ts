import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";
import SetService from "~~/server/services/SetService";

const bodySchema = z.object({
  query: z.any(),
  page: z.number(),
  size: z.number(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get members from query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Query request",
            properties: {
              query: {
                type: "object",
                summary: "Query",
              },
              page: { type: "number" },
              size: { type: "number" },
            },
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query, page, size } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await SetService.getMembersFromQuery(sessionId, query, page, size);
});
