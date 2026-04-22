import * as z from "zod";
import { NAMESPACE, PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z.array(
  z.object({
    iri: z.enum(NAMESPACE),
    read: z.boolean(),
    write: z.boolean(),
  }),
);

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user namespaces",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "array",
            summary: "Namespace list",
            items: {
              type: "object",
              properties: {
                iri: {
                  type: "string",
                  description: "Namespace iri",
                  enum: Object.values(NAMESPACE),
                },
                read: {
                  type: "boolean",
                },
                write: {
                  type: "boolean",
                },
              },
              required: ["iri", "read", "write"],
            },
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const namespaces = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.namespaces = namespaces;
  return await globalThis.apiGuard.updateUser(event, user);
});
