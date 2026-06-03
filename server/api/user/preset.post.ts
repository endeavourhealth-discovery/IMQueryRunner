import { PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ theme: z.enum(PrimeVuePresetThemes) });

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
            type: "object",
            properties: {
              theme: {
                type: "string",
                summary: "Primevue preset theme",
                enum: Object.values(PrimeVuePresetThemes)
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const body = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.theme = body.theme;
  return await globalThis.apiGuard.updateUser(event, user);
});
