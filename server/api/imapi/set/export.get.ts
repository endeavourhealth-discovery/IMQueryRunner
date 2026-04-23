import { getQueryParams } from "~~/server/helpers/getQueryParams";
import SetService from "~~/server/services/SetService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Export concept",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Concept iri",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await SetService.IMV1(sessionId, iri);
});
