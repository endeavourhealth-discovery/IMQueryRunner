import { filterOptionsSchema } from "~~/models/filterOptions.schema";
import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string(),
  schemeIris: z.string().optional()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get children of a given entity with optional filters",
    parameters: [
      {
        name: "iri",
        description: "Entity iri",
        in: "query"
      },
      {
        name: "schemeIris",
        description: "Optional scheme filters as comma separated string",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const { iri, schemeIris } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getEntityChildren(accessToken, iri, schemeIris?.split(","));
});
