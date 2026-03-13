import { z } from "~~/shared/zod";
import { PrimeVueColors } from "vue-library/enums";

const bodySchema = z.enum(PrimeVueColors).openapi({
  description: "Primevue color",
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user primary color",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const color = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.primaryColor = color;
  return await globalThis.apiGuard.updateUser(event, user);
});
