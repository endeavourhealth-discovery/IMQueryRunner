import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import EclService from "~~/server/services/EclService";

const paramSchema = z.object({
  propertyIri: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get ranges for a given property",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "propertyIri",
        description: "Property iri",
        in: "query",
      },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { propertyIri } = await getQueryParams(event, paramSchema.parse);
  return await EclService.getRangesForProperty(sessionId, propertyIri);
});
