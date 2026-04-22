import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string(),
  predicates: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get partial entity",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query"
      },
      {
        name: "predicates",
        description: "Predicate iris as comma separated string to select elements from the entity",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, predicates } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getPartialEntity(sessionId, iri, predicates.split(","));
});
