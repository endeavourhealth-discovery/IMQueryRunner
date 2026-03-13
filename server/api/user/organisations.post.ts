import { z } from "~~/shared/zod";
import { PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z.array(z.string()).openapi({
  description: "Organisations list",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user organisations",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const organisations = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.organisations = organisations;
  return await globalThis.apiGuard.updateUser(event, user);
});
