import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.object({
  match: z.any(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get nested returns",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary:
              "Add a new folder to a new location in the information model hierarchy",
            properties: {
              match: {
                type: "object",
                description: "Match",
              },
            },
            required: ["match"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const match = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.getNestedReturns(sessionId, match.match);
});
