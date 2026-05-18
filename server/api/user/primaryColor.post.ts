import { PrimeVueColors } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.enum(PrimeVueColors);

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user primary color",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "string",
            summary: "Primevue color",
            enum: Object.values(PrimeVueColors)
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const color = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.primaryColor = color;
  return await globalThis.apiGuard.updateUser(event, user);
});
