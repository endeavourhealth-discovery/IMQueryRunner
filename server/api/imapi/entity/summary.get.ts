import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get a summary (name, status, scheme, type, description) of an entity",
    parameters: [
      {
        name: "iri",
        description: "Entity iri",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const { iri } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getEntitySummary(accessToken, iri);
});
