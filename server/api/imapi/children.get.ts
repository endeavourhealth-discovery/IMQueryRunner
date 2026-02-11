import {getQueryParams} from "~~/server/helpers/getQueryParams";
import {array, object, string} from "zod/v4";

const paramSchema = object({
  iri: string(),
  schemeIris: array(string()).optional()
})

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get children of a given entity, optionally filtered by scheme",
    parameters: [
      {name: "session-id", description: "User session id", in: "cookie"},
      {name: "iri", description: "Iri of the entity", in: "query"},
      {name: "schemeIris", description: "Array of scheme IRIs", in: "query"}
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!
  const {iri, schemeIris} = await getQueryParams(event, paramSchema.parse)
  return await imapi.getEntityChildren(sessionId, iri, schemeIris)
});
