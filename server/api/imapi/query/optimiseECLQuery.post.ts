import { getQueryParams } from "~~/server/helpers/getQueryParams";
import QueryService from "~~/server/services/QueryService";

import * as z from "zod";

const bodySchema = z.any();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Optimise ecl query",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Query to be optimised"
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const query = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.optimiseECLQuery(sessionId, query);
});
