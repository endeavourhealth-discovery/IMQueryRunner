import { getQueryParams } from "~~/server/helpers/getQueryParams";
import QueryService from "~~/server/services/QueryService";

import * as z from "zod";

const paramSchema = z.object({
  queryIri: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get the sub-queries a given query is dependent upon",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "queryIri", description: "Iri of the query", in: "query" }
    ]
  }
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id");

  const { queryIri } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.getSubqueryIris(sessionId!, queryIri);
});
