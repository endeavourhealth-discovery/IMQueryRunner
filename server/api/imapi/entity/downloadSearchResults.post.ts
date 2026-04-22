import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const bodySchema = z.object({
  queryRequest: z.any().optional(),
  eclSearchRequest: z.any().optional(),
  totalCount: z.number().optional(),
  format: z.string().optional(),
  includeDefinition: z.boolean().optional(),
  includeCore: z.boolean().optional(),
  includeLegacy: z.boolean().optional(),
  includeSubsets: z.boolean().optional(),
  subsetsOnOwnRow: z.boolean().optional(),
  im1id: z.boolean().optional()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate ecl",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Request to download search results",
            properties: {
              queryRequest: {
                type: "object",
                description: "Query for searching",
                additionalProperties: true
              },
              eclSearchRequest: {
                type: "object",
                description: "ECL search request payload",
                additionalProperties: true
              },
              totalCount: {
                type: "number",
                description: "Total number of results"
              },
              format: {
                type: "string",
                description: "Output format"
              },
              includeDefinition: {
                type: "boolean"
              },
              includeCore: {
                type: "boolean"
              },
              includeLegacy: {
                type: "boolean"
              },
              includeSubsets: {
                type: "boolean"
              },
              subsetsOnOwnRow: {
                type: "boolean"
              },
              im1id: {
                type: "boolean"
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const downloadOptions = await readValidatedBody(event, bodySchema.parse);
  return await EntityService.downloadSearchResults(sessionId, downloadOptions);
});
