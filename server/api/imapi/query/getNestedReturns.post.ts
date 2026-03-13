import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import QueryService from "~~/server/services/QueryService";

const bodySchema = object({
  match: any(),
}).openapi({
  description: "Match",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get nested returns",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const match = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.getNestedReturns(sessionId, match.match);
});
