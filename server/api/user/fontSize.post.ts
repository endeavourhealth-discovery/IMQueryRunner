import * as z from "zod";
import { FontSize } from "vue-library/enums";

const bodySchema = z.enum(FontSize);

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user font size",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "string",
            summary: "Font size",
            enum: Object.values(FontSize),
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event): Promise<any> => {
  const fontSize = await readValidatedBody(event, bodySchema.parse);
  const user = await globalThis.apiGuard.getUser(event);
  user.fontSize = fontSize;
  return await globalThis.apiGuard.updateUser(event, user);
});
