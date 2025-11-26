import Logger from "~~/shared/logger";
import { userSettingsSchema } from "~~/models/UserSettings";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  selectUserSettingsSchema,
  userSettings,
} from "~~/server/db/postgres/schemas/user/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/user/settings.post");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  const rows = await postgresDb
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user!.id))
    .limit(1);
  const results = selectUserSettingsSchema.parse(rows[0]);
  return results;
});
