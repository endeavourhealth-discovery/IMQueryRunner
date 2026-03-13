import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.any().openapi({
  description:
    "Search the information model using a query returning a search response",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Query IM",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const query = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.queryIMSearch(sessionId, query);
});
