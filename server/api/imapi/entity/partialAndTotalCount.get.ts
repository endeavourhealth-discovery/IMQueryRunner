import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";
import { filterOptionsSchema } from "~~/models/filterOptions.schema";

const paramSchema = z.object({
  iri: z.string(),
  predicate: z.string(),
  page: z.number(),
  size: z.number(),
  schemeIris: z.string().optional(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get partial entity and total count with optional filters",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
      { name: "predicate", description: "Predicate iri", in: "query" },
      { name: "page", description: "Page number", in: "query" },
      { name: "size", description: "Page size", in: "query" },
      {
        name: "schemeIris",
        description: "Optional scheme filters as comma separated string",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, predicate, page, size, schemeIris } = await getQueryParams(
    event,
    paramSchema.parse,
  );
  return await EntityService.getPartialAndTotalCount(
    sessionId,
    iri,
    predicate,
    page,
    size,
    schemeIris?.split(","),
  );
});
