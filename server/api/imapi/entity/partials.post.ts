import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import EntityService from "~~/server/services/EntityService";

const bodySchema = z
  .object({
    typeIris: z.array(z.string()),
    predicates: z.array(z.string()),
  })
  .openapi({
    description: "Request allowing for multiple getPartial requests at once",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get multiple partial entities",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { typeIris, predicates } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await EntityService.getPartialEntities(
    sessionId,
    typeIris,
    predicates,
  );
});
