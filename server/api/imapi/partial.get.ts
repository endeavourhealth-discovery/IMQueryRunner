import {getQueryParams} from "~~/server/helpers/getQueryParams";
import {array, object, string} from "zod/v4";

const paramSchema = object({
  iri: string(),
  predicates: array(string())
})

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get partial entity given property IRIs",
    parameters: [
      {name: "session_id", description: "User session id", in: "cookie"},
      {name: "iri", description: "Iri of the entity", in: "query"},
      {name: "predicates", description: "Array of predicate IRIs", in: "query"}
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!
  const {iri, predicates} = await getQueryParams(event, paramSchema.parse)
  return await imapi.getPartialEntity(sessionId, iri, predicates)
});
