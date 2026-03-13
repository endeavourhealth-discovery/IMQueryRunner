import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  query: any(),
}).openapi({ description: "Query to convert to ecl" });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get ecl from a query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getEcl(sessionId, query);
});
