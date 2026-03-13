import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, number, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";
import { filterOptionsSchema } from "~~/models/filterOptions.schema";

const paramSchema = object({
  iri: string(),
  predicate: string(),
  pageIndex: number(),
  pageSize: number(),
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
        in: "query",
      },
      {
        name: "predicate",
        description: "Predicate for additional details",
        in: "query",
      },
      { name: "pageIndex", description: "Page number", in: "query" },
      { name: "pageSize", description: "Page size", in: "query" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, predicate, pageIndex, pageSize } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await EntityService.loadMoreDetailsDisplay(
    sessionId,
    iri,
    predicate,
    pageIndex,
    pageSize,
  );
});
