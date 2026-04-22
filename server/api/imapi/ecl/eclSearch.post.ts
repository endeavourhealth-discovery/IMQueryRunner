import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const bodySchema = z.object({
  eclSearchRequest: z.any(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Search entities using ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Request containing the ecl for searching",
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { eclSearchRequest } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.ECLSearch(sessionId, eclSearchRequest);
});
