import { getQueryParams } from "~~/server/helpers/getQueryParams";
import FilerService from "~~/server/services/FilerService";

import * as z from "zod";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get entity as summary",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  return await FilerService.downloadDeltas(sessionId);
});
