import { getQueryParams } from "~~/server/helpers/getQueryParams";
import QueryService from "~~/server/services/QueryService";

import * as z from "zod";

const paramSchema = z.object({
  queryIri: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get query",
    parameters: [
      {
        name: "iri",
        description: "Query iri",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const { queryIri } = await getQueryParams(event, paramSchema.parse);
  return await QueryService.getQueryFromIri(accessToken, queryIri);
});
