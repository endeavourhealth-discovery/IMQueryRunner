import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const paramSchema = z.object({
  iri: z.string(),
  schemeIris: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get entity parents",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iri",
        description: "Entity iri",
        in: "query",
      },
      {
        name: "schemeIris",
        description: "Scheme iris as comma separated string to filter results",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iri, schemeIris } = await getQueryParams(event, paramSchema.parse);
  return await EntityService.getEntityParents(
    sessionId,
    iri,
    schemeIris.split(","),
  );
});
