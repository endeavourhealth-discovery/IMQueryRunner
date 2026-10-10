import { PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ theme: z.enum(PrimeVuePresetThemes) });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user preset theme",
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
  return await updateCurrentUserPreferences(event, { theme: body.theme });
});
