import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string } from "zod/v4";
import EclService from "~~/server/services/EclService";

const paramSchema = object({
  conceptIri: string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Search entities using ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "conceptIri",
        description: "Concept iris in a comma separated string",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { conceptIri } = await getQueryParams(event, paramSchema.parse);
  return await EclService.getPropertiesForDomains(
    sessionId,
    conceptIri.split(","),
  );
});
