import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import SetService from "~~/server/services/SetService";

const bodySchema = z
  .object({
    ownRow: z.boolean().default(false),
    format: z.string(),
    options: z.object({
      setIri: z.string(),
      schemes: z.array(z.string()).prefault([]),
      includeIM1id: z.boolean().default(false),
      subsumptions: z.array(z.string()).prefault([]),
      includeDefinition: z.boolean().default(false),
      includeCore: z.boolean().default(false),
      includeLegacy: z.boolean().default(false),
      includeSubsets: z.boolean().default(false),
    }),
  })
  .openapi({
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
