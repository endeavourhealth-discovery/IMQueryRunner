import {
  pgSchema,
  uuid,
  varchar,
  jsonb,
  timestamp,
  integer,
  text,
} from "drizzle-orm/pg-core";

const queryRunner = pgSchema("query_runner");

export const queryQueue = queryRunner.table("job", {
  id: uuid("id").primaryKey().notNull(),
  jobName: varchar("job_name", { length: 255 }).notNull(), //defaults to query name
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  queryRequest: jsonb("query_request").notNull(),
  userId: uuid("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  queuedAt: timestamp("queued_at", { precision: 3, mode: "string" }),
  startedAt: timestamp("started_at", { precision: 3, mode: "string" }),
  pid: integer("pid"),
  stoppedAt: timestamp("stopped_at", { precision: 3, mode: "string" }),
  status: text("status").notNull(),
  error: text("error"),
});
