import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  schema: [
    "./server/db/postgres/queueItemSchema.ts",
    "./server/db/postgres/userSetting.ts",
  ],
  out: "./server/db/postgres",
});
