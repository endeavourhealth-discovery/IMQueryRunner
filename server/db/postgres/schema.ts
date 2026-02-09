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

export const jobTable = queryRunner.table("job", {
  dbid: uuid("id").primaryKey().notNull(),
  jobName: varchar("job_name", { length: 255 }).notNull(), //defaults to query name
  queryRequest: jsonb("query_request").notNull(),
  userId: uuid("user_id").notNull(),
  queueDate: timestamp("queue_date", { precision: 3, mode: "string" }),
  runDate: timestamp("run_date", { precision: 3, mode: "string" }),
  finishDate: timestamp("finish_date", { precision: 3, mode: "string" }),
  pid: integer("pid"),
  status: text("status").notNull(),
  error: text("error"),
});
