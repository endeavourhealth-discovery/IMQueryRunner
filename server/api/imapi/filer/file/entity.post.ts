import { getQueryParams } from "~~/server/helpers/getQueryParams";
import * as z from "zod";
import FilerService from "~~/server/services/FilerService";
import { NAMESPACE } from "vue-library/enums";

const bodySchema = z.object({
  entity: z.any(),
  namespace: z.enum(NAMESPACE),
  crud: z.string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Add folder",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "File an entity in the information model",
            properties: {
              entity: {
                type: "object",
                description: "Entity payload",
                additionalProperties: true,
              },
              namespace: {
                type: "string",
                description: "Target namespace",
                enum: Object.values(NAMESPACE),
              },
              crud: {
                type: "string",
                description: "CRUD operation identifier",
              },
            },
            required: ["entity", "namespace", "crud"],
          },
        },
      },
    },
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
