import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { any, array, boolean, object, string, enum as zenum } from "zod/v4";
import FilerService from "~~/server/services/FilerService";
import { NAMESPACE } from "vue-library/enums";

const bodySchema = object({
  document: any(),
}).openapi({
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
