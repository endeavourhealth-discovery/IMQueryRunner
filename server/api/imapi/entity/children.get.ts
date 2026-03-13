import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";
import { filterOptionsSchema } from "~~/models/filterOptions.schema";

const paramSchema = object({
  iri: string(),
  schemeIris: string().optional(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get children of a given entity with optional filters",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
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
  const { iri, schemeIris } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getEntityChildren(
    sessionId,
    iri,
    schemeIris?.split(","),
  );
});
