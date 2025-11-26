import { pgSchema, pgTable, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const user = pgSchema("user");

export const userSettings = user.table("settings", {
  userId: text().primaryKey().notNull(),
  currentPreset: text(),
  currentPrimaryColor: text(),
  currentSurfaceColor: text(),
  darkMode: boolean(),
  currentScale: text(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);
