import { PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.enum(PrimeVuePresetThemes);

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user preset theme",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "string",
            summary: "Primevue preset theme",
            enum: Object.values(PrimeVuePresetThemes)
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const preset = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.theme = preset;
  return await globalThis.apiGuard.updateUser(event, user);
});
