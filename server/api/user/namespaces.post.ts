import { z } from "~~/shared/zod";
import { NAMESPACE, PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z
  .array(
    z.object({
      iri: z.enum(NAMESPACE),
      read: z.boolean(),
      write: z.boolean(),
    }),
  )
  .openapi({
    description: "Namespace list",
  });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user namespaces",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const namespaces = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.namespaces = namespaces;
  return await globalThis.apiGuard.updateUser(event, user);
});
