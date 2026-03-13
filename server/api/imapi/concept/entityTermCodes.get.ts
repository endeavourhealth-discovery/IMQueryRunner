import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { boolean, object, string } from "zod/v4";
import ConceptService from "~~/server/services/ConceptService";

const paramSchema = object({
  iri: string(),
  includeInactive: boolean(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get term codes of a given entity",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "iri", description: "Iri of the entity", in: "query" },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, includeInactive } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await ConceptService.getEntityTermCodes(
    sessionId,
    iri,
    includeInactive,
  );
});
