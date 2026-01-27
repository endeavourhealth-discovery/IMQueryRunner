import { drizzle } from "drizzle-orm/mysql2";

if (!process.env.COMPASS_URL) {
  throw new Error("Missing COMPASS_URL environment variable");
}

export const mysqlDb = drizzle(process.env.COMPASS_URL);