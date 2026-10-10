import { FontSize } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.object({ fontSize: z.enum(FontSize) });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user font size",
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
  return await updateCurrentUserPreferences(event, { fontSize: body.fontSize });
});
