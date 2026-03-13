import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string, enum as zenum } from "zod/v4";
import QueryService from "~~/server/services/QueryService";
import { DisplayMode } from "vue-library/enums";

const bodySchema = object({
  query: any(),
  displayMode: zenum(DisplayMode),
}).openapi({
  description: "Get query display from a query",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display from query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { query, displayMode } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await QueryService.getQueryDisplayFromQuery(
    sessionId,
    query,
    displayMode,
  );
});
