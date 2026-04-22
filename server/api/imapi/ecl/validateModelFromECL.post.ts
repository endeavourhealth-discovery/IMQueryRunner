import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EclService from "~~/server/services/EclService";

import * as z from "zod";

const bodySchema = z.object({
  ecl: z.string(),
  showNames: z.boolean()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate model using ecl",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Ecl model validation request",
            properties: {
              ecl: {
                type: "string"
              },
              showNames: {
                type: "boolean"
              }
            },
            required: ["ecl"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { ecl, showNames } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.validateModelFromECL(sessionId, ecl, showNames);
});
