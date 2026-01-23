import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./postgres/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { queryQueue } from "./postgres/schema";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL environment variable");
}

export const postgresDb = drizzle(process.env.POSTGRES_URL!, { schema });
export const pgQueueItemInsert = createInsertSchema(queryQueue);
export const pgQueueItemSelect = createSelectSchema(queryQueue);
