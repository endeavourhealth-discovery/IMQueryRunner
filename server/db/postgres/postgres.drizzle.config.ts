import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  schema: [
    "./server/db/postgres/schemas/query_runner/schema.ts",
    "./server/db/postgres/schemas/user/schema.ts",
  ],
  out: "./server/db/postgres",
});
