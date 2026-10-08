import * as z from "zod";

const bodySchema = z.array(z.string());

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user favourites",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "array",
            summary: "Favourites",
            items: {
              type: "string"
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const favourites = await readValidatedBody(event, bodySchema.parse);
  return await updateCurrentUserPreferences(event, { favourites });
});
