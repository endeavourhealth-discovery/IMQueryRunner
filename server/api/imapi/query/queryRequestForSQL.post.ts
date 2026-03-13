import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.any().openapi({
  description: "Get a query request from sql statement",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Query request for SQL",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const queryRequest = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.getQueryRequestForSQL(sessionId, queryRequest);
});
