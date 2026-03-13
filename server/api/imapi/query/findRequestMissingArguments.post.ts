import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import QueryService from "~~/server/services/QueryService";

const bodySchema = z.any().openapi({
  description: "Query request",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Find request missing arguments",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const queryRequest = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.findMissingArguments(sessionId, queryRequest);
});
