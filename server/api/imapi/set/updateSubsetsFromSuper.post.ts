import { getQueryParams } from "~~/server/helpers/getQueryParams";
import SetService from "~~/server/services/SetService";

import * as z from "zod";

const bodySchema = z.any();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update subsets from super",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Entity"
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const entity = await readValidatedBody(event, bodySchema.parse);
  return await SetService.updateSubsetsFromSuper(sessionId, entity);
});
