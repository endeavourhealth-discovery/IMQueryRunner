import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const queueItem = pgTable("QueueItem", {
	id: text().primaryKey().notNull(),
	queryIri: varchar("query_iri", { length: 255 }).notNull(),
	queryName: varchar("query_name", { length: 255 }).notNull(),
	queryRequest: jsonb("query_request").notNull(),
	userId: text("user_id").notNull(),
	userName: varchar("user_name", { length: 255 }).notNull(),
	queuedAt: timestamp("queued_at", { precision: 3, mode: 'string' }),
	startedAt: timestamp("started_at", { precision: 3, mode: 'string' }),
	pid: integer(),
	finishedAt: timestamp("finished_at", { precision: 3, mode: 'string' }),
	killedAt: timestamp("killed_at", { precision: 3, mode: 'string' }),
	status: text().notNull(),
	error: text(),
});
