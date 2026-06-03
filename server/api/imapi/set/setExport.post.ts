import { getQueryParams } from "~~/server/helpers/getQueryParams";
import SetService from "~~/server/services/SetService";

import * as z from "zod";

const bodySchema = z.object({
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
    includeSubsets: z.boolean().default(false)
  })
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get members from query",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Set export request",
            properties: {
              ownRow: {
                type: "boolean",
                default: false
              },
              format: {
                type: "string"
              },
              options: {
                type: "object",
                properties: {
                  setIri: {
                    type: "string"
                  },
                  schemes: {
                    type: "array",
                    items: { type: "string" },
                    default: []
                  },
                  includeIM1id: {
                    type: "boolean",
                    default: false
                  },
                  subsumptions: {
                    type: "array",
                    items: { type: "string" },
                    default: []
                  },
                  includeDefinition: {
                    type: "boolean",
                    default: false
                  },
                  includeCore: {
                    type: "boolean",
                    default: false
                  },
                  includeLegacy: {
                    type: "boolean",
                    default: false
                  },
                  includeSubsets: {
                    type: "boolean",
                    default: false
                  }
                },
                required: ["setIri"]
              }
            },
            required: ["format", "options"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const setExportRequest = await readValidatedBody(event, bodySchema.parse);
  return await SetService.getFullExportSet(sessionId, setExportRequest);
});
