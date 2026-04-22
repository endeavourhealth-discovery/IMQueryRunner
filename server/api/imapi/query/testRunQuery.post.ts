import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.any();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Test run query",
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
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const queryRequest = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.testRunQuery(sessionId, queryRequest);
});
