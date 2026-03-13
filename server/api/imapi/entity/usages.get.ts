import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, number, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";

const paramSchema = object({
  iri: string(),
  page: number(),
  size: number(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get entity usages",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
      {
        name: "page",
        description: "Page size",
        in: "query",
      },
      { name: "size", description: "Page size", in: "query" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, page, size } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getEntityUsages(sessionId, iri, page, size);
});
