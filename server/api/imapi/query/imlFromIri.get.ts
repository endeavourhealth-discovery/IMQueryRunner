import { getQueryParams } from "~~/server/helpers/getQueryParams";
import QueryService from "~~/server/services/QueryService";

import { DisplayMode } from "vue-library/enums";

import * as z from "zod";

const paramSchema = z.object({
  queryIri: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get iml from query iri",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "queryIri",
        description: "Query iri",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { queryIri } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.generateQueryIML(sessionId, queryIri);
});
