import * as z from "zod";

const bodySchema = z.object({ bool: z.boolean() });

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user dark mode",
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
  return await updateCurrentUserPreferences(event, { darkMode: darkMode.bool });
});
