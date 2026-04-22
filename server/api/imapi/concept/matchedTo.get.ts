import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import ConceptService from "~~/server/services/ConceptService";

const paramSchema = z.object({
  iri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get matchedTo of a given entity",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "iri", description: "Iri of the entity", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await ConceptService.getMatchedTo(sessionId, iri);
});
