import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const bodySchema = z.object({
  query: z.any(),
  displayMode: z.enum(DisplayMode),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display from query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Get query display from a query",
            properties: {
              query: {
                type: "object",
                description: "Query to get display for",
              },
              displayMode: {
                type: "string",
                description: "Iri of the folder",
                enum: Object.values(DisplayMode),
              },
            },
            required: ["query", "displayMode"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query, displayMode } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await QueryService.getQueryDisplayFromQuery(
    sessionId,
    query,
    displayMode,
  );
});
