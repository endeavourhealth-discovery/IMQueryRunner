import { getQueryParams } from "~~/server/helpers/getQueryParams";
import QueryService from "~~/server/services/QueryService";

import { DisplayMode } from "@endeavour/vue-library/enums";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query display",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  return await QueryService.getDefaultQuery(sessionId);
});
