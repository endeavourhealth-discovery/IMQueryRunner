import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EclService from "~~/server/services/EclService";

import * as z from "zod";

const bodySchema = z.object({
  query: z.any()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate ecl from query model",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Validate ecl from query model",
            properties: {
              query: {
                type: "object"
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.validateModelFromQuery(sessionId, query);
});
