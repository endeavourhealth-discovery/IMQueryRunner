import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(500).default(50)
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get a page of the children of a given entity, with the total count",
    parameters: [
      {
        name: "iri",
        description: "Entity iri",
        in: "query"
      },
      {
        name: "page",
        description: "Page number, starting at 1",
        in: "query"
      },
      {
        name: "size",
        description: "Page size",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const accessToken = await getAccessToken(event);
  const { iri, page, size } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getPagedChildren(accessToken, iri, page, size);
});
