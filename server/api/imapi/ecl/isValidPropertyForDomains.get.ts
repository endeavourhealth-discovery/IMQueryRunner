import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EclService from "~~/server/services/EclService";

import * as z from "zod";

const paramSchema = z.object({
  propertyIri: z.string(),
  conceptIri: z.array(z.string())
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Search entities using ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      { name: "propertyIri", description: "Property iri", in: "query" },
      {
        name: "conceptIri",
        description: "Concept iris as comma separated string",
        in: "query"
      }
    ]
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { conceptIri, propertyIri } = await getQueryParams(event, paramSchema.parse);
  return await EclService.isValidPropertyForDomains(sessionId, propertyIri, conceptIri);
});
