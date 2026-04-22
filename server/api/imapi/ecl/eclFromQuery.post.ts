import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const bodySchema = z.object({
  query: z.any(),
  showNames: z.boolean().optional(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Convert query to ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Request containing the query for conversion to ecl",
            properties: {
              query: {
                type: "object",
                description: "Query to convert to ecl",
              },
              showNames: {
                type: "boolean",
              },
            },
            required: ["query"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query, showNames } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getECLFromQuery(sessionId, query, showNames);
});
