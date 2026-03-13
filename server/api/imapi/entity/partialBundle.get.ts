import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";

const paramSchema = object({
  iri: string(),
  predicates: string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get partial entity as bundle",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
      {
        name: "predicates",
        description:
          "Predicate iris as comma separated string to select elements from the entity",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, predicates } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getPartialEntityBundle(
    sessionId,
    iri,
    predicates.split(","),
  );
});
