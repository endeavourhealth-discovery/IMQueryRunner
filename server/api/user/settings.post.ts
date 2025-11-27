import Logger from "~~/shared/logger";
import { userSettingsSchema } from "~~/models/UserSettings";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  userSettings,
  insertUserSettingsSchema,
} from "~~/server/db/postgres/schemas/user/schema";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/user/settings.post");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  LOG.info(await readBody(event));
  const userSettingsData = await readValidatedBody(
    event,
    userSettingsSchema.parse
  );
  const userSettingsInput = {
    currentPreset: userSettingsData.currentPreset,
    currentPrimaryColor: userSettingsData.currentPrimaryColor,
    currentScale: userSettingsData.currentScale,
    currentSurfaceColor: userSettingsData.currentSurfaceColor,
    darkMode: userSettingsData.darkMode,
    userId: user?.id,
  };
  await postgresDb
    .insert(userSettings)
    .values(insertUserSettingsSchema.parse(userSettingsInput))
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: insertUserSettingsSchema.parse(userSettingsInput),
    });
});
