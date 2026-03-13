import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, boolean, number, object, string } from "zod/v4";
import EntityService from "~~/server/services/EntityService";

const bodySchema = object({
  queryRequest: any().optional(),
  eclSearchRequest: any().optional(),
  totalCount: number().optional(),
  format: string().optional(),
  includeDefinition: boolean().optional(),
  includeCore: boolean().optional(),
  includeLegacy: boolean().optional(),
  includeSubsets: boolean().optional(),
  subsetsOnOwnRow: boolean().optional(),
  im1id: boolean().optional(),
}).openapi({ description: "Download options" });

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
