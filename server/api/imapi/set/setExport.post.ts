import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, number, object, string } from "zod/v4";
import SetService from "~~/server/services/SetService";

const bodySchema = object({
  ownRow: boolean().default(false),
  format: string(),
  options: object({
    setIri: string(),
    schemes: array(string()).prefault([]),
    includeIM1id: boolean().default(false),
    subsumptions: array(string()).prefault([]),
    includeDefinition: boolean().default(false),
    includeCore: boolean().default(false),
    includeLegacy: boolean().default(false),
    includeSubsets: boolean().default(false),
  }),
}).openapi({
  description: "Set export request",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get members from query",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const setExportRequest = await readValidatedBody(event, bodySchema.parse);
  return await SetService.getFullExportSet(sessionId, setExportRequest);
});
