import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EclService from "~~/server/services/EclService";

import * as z from "zod";

const bodySchema = z.object({
  ecl: z.string(),
  showNames: z.boolean(),
  status: z.object({
    valid: z.boolean()
  })
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Convert ecl to ecl with names and validation",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Ecl string with optional showNames and valid status required flags"
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const eclSearchRequest = await readValidatedBody(event, bodySchema.parse);
  return await EclService.ECLSearch(sessionId, eclSearchRequest);
});
