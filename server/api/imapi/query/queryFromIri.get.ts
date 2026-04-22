import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import QueryService from "~~/server/services/QueryService";

const paramSchema = z.object({
  queryIri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Query iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { queryIri } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.getQueryFromIri(sessionId, queryIri);
});
