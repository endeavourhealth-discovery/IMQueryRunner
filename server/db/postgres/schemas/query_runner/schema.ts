import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  pgSchema,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { type QueryRequest } from "~~/models/AutoGen";

const query_runner = pgSchema("query_runner");

export const queueItem = query_runner.table("QueueItem", {
  id: text().primaryKey().notNull(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  queryName: varchar("query_name", { length: 255 }).notNull(),
  queryRequest: jsonb("query_request").$type<QueryRequest>().notNull(),
  userId: text("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  queuedAt: timestamp("queued_at", { precision: 3, mode: "string" }),
  startedAt: timestamp("started_at", { precision: 3, mode: "string" }),
  pid: integer(),
  finishedAt: timestamp("finished_at", { precision: 3, mode: "string" }),
  killedAt: timestamp("killed_at", { precision: 3, mode: "string" }),
  status: text().notNull(),
  error: text(),
});

export const insertQueueItemSchema = createInsertSchema(queueItem);
export const selectQueueItemSchema = createSelectSchema(queueItem);
