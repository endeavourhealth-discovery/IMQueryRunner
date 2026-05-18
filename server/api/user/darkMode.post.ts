import { PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ bool: z.boolean() });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user dark mode",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Dark mode",
            properties: {
              bool: {
                type: "boolean"
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const darkMode = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.darkMode = darkMode.bool;
  return await globalThis.apiGuard.updateUser(event, user);
});
