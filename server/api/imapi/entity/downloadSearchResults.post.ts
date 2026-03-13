import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const bodySchema = z
  .object({
    queryRequest: z.any().optional(),
    eclSearchRequest: z.any().optional(),
    totalCount: z.number().optional(),
    format: z.string().optional(),
    includeDefinition: z.boolean().optional(),
    includeCore: z.boolean().optional(),
    includeLegacy: z.boolean().optional(),
    includeSubsets: z.boolean().optional(),
    subsetsOnOwnRow: z.boolean().optional(),
    im1id: z.boolean().optional(),
  })
  .openapi({ description: "Download options" });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate ecl",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const downloadOptions = await readValidatedBody(event, bodySchema.parse);
  return await EntityService.downloadSearchResults(sessionId, downloadOptions);
});
