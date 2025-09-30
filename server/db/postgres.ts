import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./postgres/schema"
import {createInsertSchema, createSelectSchema} from "drizzle-zod";
import {queueItem} from "./postgres/schema";

export const postgresDb = drizzle(process.env.POSTGRES_URL!, { schema });
export const pgQueueItemInsert = createInsertSchema(queueItem);
export const pgQueueItemSelect = createSelectSchema(queueItem);