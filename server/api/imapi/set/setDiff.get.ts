import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import SetService from "~~/server/services/SetService";

const paramSchema = z.object({
  iriA: z.string(),
  iriB: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Compare sets",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iriA",
        description: "Set iri a",
        in: "query",
      },
      {
        name: "iriB",
        description: "Set iri b",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iriA, iriB } = await getQueryParams(event, paramSchema.parse);
  return await SetService.getSetComparison(sessionId, iriA, iriB);
});
