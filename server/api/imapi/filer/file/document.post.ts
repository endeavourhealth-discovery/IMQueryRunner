import { getQueryParams } from "~~/server/helpers/getQueryParams";
import FilerService from "~~/server/services/FilerService";

import { NAMESPACE } from "vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({
  document: z.any()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "File document",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "File a document of entities in the information model",
            properties: {
              document: {
                type: "object",
                description: "Document",
                additionalProperties: true
              }
            },
            required: ["document"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { document } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.fileDocument(sessionId, document);
});
