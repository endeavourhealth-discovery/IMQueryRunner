import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  query: any(),
}).openapi({ description: "Request containing the query for validation" });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate ecl from query model",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.validateModelFromQuery(sessionId, query);
});
