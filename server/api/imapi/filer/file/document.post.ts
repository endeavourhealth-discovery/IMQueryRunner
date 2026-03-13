import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { z } from "~~/shared/zod";
import FilerService from "~~/server/services/FilerService";
import { NAMESPACE } from "vue-library/enums";

const bodySchema = z
  .object({
    document: z.any(),
  })
  .openapi({
    description: "File a document of entities in the information model",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "File document",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { document } = await readValidatedBody(event, bodySchema.parse);
  return await FilerService.fileDocument(sessionId, document);
});
