import { PrimeVueColors } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ color: z.enum(PrimeVueColors) });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user surface color",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              color: {
                type: "string",
                description: "Surface color",
                enum: Object.values(PrimeVueColors)
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
  user.surfaceColor = body.color;
  return await globalThis.apiGuard.updateUser(event, user);
});
