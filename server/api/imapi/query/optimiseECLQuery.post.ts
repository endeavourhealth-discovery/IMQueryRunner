import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import QueryService from "~~/server/services/QueryService";

const bodySchema = any().openapi({
  description: "Optimise an ecl query",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Optimise ecl query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const query = await readValidatedBody(event, bodySchema.parse);
  return await QueryService.optimiseECLQuery(sessionId, query);
});
