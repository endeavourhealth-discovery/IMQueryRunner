import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  dbCredentials: {
    url: process.env.COMPASS_URL!
  },
  schema: "./server/db/mysql/schema.ts",
  out: "./server/db/mysql"
});
