import * as z from "zod";
import { PrimeVuePresetThemes } from "vue-library/enums";

const bodySchema = z.boolean();

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user dark mode",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "boolean",
            summary: "Dark mode",
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const darkMode = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.darkMode = darkMode;
  return await globalThis.apiGuard.updateUser(event, user);
});
