import { z } from "~~/shared/zod";
import { PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z.boolean().openapi({
  description: "Boolean",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user dark mode",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const darkMode = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.darkMode = darkMode;
  return await globalThis.apiGuard.updateUser(event, user);
});
