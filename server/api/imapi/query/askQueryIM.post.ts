import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.any();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Ask query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Query the IM with a boolean response if result is found",
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const query = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.askQuery(sessionId, query);
});
