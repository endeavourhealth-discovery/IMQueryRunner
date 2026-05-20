import { MySql2Database, drizzle } from "drizzle-orm/mysql2";

import * as schema from "./mysql/schema";

if (!process.env.COMPASS_URL) {
  throw new Error("Missing COMPASS_URL environment variable");
}

export const mysqlDb: MySql2Database<typeof schema> = drizzle({
  connection: process.env.COMPASS_URL,
  schema,
  mode: "default"
});
