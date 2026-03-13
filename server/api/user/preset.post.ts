import { z } from "~~/shared/zod";
import { PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z.enum(PrimeVuePresetThemes).openapi({
  description: "Primevue preset theme",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user preset theme",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const preset = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.theme = preset;
  return await globalThis.apiGuard.updateUser(event, user);
});
