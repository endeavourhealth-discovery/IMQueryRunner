import { FontSize } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ fontSize: z.enum(FontSize) });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user font size",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            summary: "Font size",
            properties: {
              fontSize: {
                type: "string",
                enum: Object.values(FontSize)
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
  user.fontSize = body.fontSize;
  return await globalThis.apiGuard.updateUser(event, user);
});
