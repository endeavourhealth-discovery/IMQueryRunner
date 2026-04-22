import { getQueryParams } from "~~/server/helpers/getQueryParams";
import EntityService from "~~/server/services/EntityService";

import * as z from "zod";

const bodySchema = z.object({
  validationIri: z.string(),
  entity: z.any()
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate entity",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Validation request with validation iri and entity to be validated",
            properties: {
              validationIri: {
                type: "string",
                description: "IRI used for validation"
              },
              entity: {
                type: "object",
                description: "Entity payload to be validated (any shape)",
                additionalProperties: true
              }
            },
            required: ["validationIri", "entity"]
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { validationIri, entity } = await readValidatedBody(event, bodySchema.parse);
  return await EntityService.checkValidation(sessionId, validationIri, entity);
});
