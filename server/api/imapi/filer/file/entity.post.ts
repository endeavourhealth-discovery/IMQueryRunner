import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import FilerService from "~~/server/services/FilerService";
import { NAMESPACE } from "vue-library/enums";

const bodySchema = z
  .object({
    entity: z.any(),
    namespace: z.enum(NAMESPACE),
    crud: z.string(),
  })
  .openapi({
    description: "File an entity in the information model",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Add folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { entity, namespace, crud } = await readValidatedBody(
    event,
    bodySchema.parse,
  );
  return await FilerService.fileEntity(sessionId, entity, namespace, crud);
});
