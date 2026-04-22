import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const bodySchema = z.object({
  query: z.any(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get ecl from a query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object", summary: "Query to convert to ecl" },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getEcl(sessionId, query);
});
