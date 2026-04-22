import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const bodySchema = z.object({
  ecl: z.string(),
  showNames: z.boolean(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Request containing the ecl for validation",
            properties: {
              query: {
                type: "object",
                description: "Query for validation",
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
  const { ecl, showNames } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.validateECL(sessionId, ecl, showNames);
});
