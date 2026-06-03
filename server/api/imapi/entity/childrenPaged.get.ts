import { filterOptionsSchema } from "~~/models/filterOptions.schema";
import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const paramSchema = z.object({
  iri: z.string(),
  page: z.number(),
  size: z.number(),
  schemeIris: z.string().optional(),
  typeFilter: z.string().optional()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get paged children of a given entity with optional filters",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query"
      },
      { name: "page", description: "Page number", in: "query" },
      { name: "size", description: "Page size", in: "query" },
      {
        name: "schemeIris",
        description: "Optional scheme filters as comma separated string",
        in: "query"
      },
      {
        name: "typeFilter",
        description: "Optional type filter as comma separated string",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, page, size, schemeIris, typeFilter } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getPagedChildren(sessionId, iri, page, size, schemeIris?.split(","));
});
