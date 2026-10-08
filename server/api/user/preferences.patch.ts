import { userPreferencesSchema } from "~~/models/userPreferences.schema";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description:
      "Update any subset of the signed-in user's preferences (theme, primaryColor, surfaceColor, darkMode, fontSize, favourites, recentActivity) in one call"
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const preferences = await readValidatedBody(event, userPreferencesSchema.parse);
  return await updateCurrentUserPreferences(event, preferences);
});
