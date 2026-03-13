import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const bodySchema = z
  .object({
    validationIri: z.string(),
    entity: z.any(),
  })
  .openapi({
    description:
      "Validation request with validation iri and entity to be validated",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Validate entity",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { validationIri, entity } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await EntityService.checkValidation(sessionId, validationIri, entity);
});
