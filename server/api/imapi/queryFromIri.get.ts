import {getQueryParams} from "~~/server/helpers/getQueryParams";
import {object, string} from "zod/v4";

const paramSchema = object({
  queryIri: string(),
})

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query of a given iri",
    parameters: [
      {name: "session_id", description: "User session id", in: "cookie"},
      {name: "queryIri", description: "Iri of the entity", in: "query"}
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!
  const {queryIri} = await getQueryParams(event, paramSchema.parse)
  return await imapi.getQueryFromIri(sessionId, queryIri)
});