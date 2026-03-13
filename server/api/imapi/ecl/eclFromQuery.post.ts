import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const bodySchema = object({
  query: any(),
  showNames: boolean().optional(),
}).openapi({
  description: "Request containing the query for conversion to ecl",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Convert query to ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query, showNames } = await readValidatedBody(event, bodySchema.parse);
  return await EclService.getECLFromQuery(sessionId, query, showNames);
});
