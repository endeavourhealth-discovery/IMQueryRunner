import { JobStatus } from "~~/enums/JobStatus";

import { IMQType } from "@endeavour/vue-library";
import { type QueryRequest } from "@endeavour/vue-library/models";

import { bigint, date, datetime, index, int, json, mysqlTable, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mysqlSchema } from "drizzle-orm/mysql-core";

// Only the tables this application reads or writes. The source clinical tables (patient, observation, encounter and so on) are
// queried by the generated SQL, never through drizzle, so they are deliberately not declared here: every table declared is bundled
// into the server and registered with drizzle. NOTE: `drizzle-kit pull` writes its output over this file, so re-apply this trim
// (and the index() definitions) after running it.
const dataset = mysqlSchema("dataset");

export const jobTable = dataset.table(
  "job",
  {
    id: int("id").autoincrement().notNull().primaryKey(),
    jobName: varchar("job_name", { length: 255 }).notNull(),
    queryRequests: json("query_requests").$type<QueryRequest[]>().notNull(),
    startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
    persistent: tinyint("persistent").notNull(),
    useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
    userId: varchar("user_id", { length: 45 }).notNull(),
    queueDate: datetime("queue_date", { mode: "string" }).notNull(),
    runDate: datetime("run_date", { mode: "string" }).notNull(),
    finishDate: datetime("finish_date", { mode: "string" }),
    status: varchar("status", { length: 45 }).$type<JobStatus>().notNull(),
    error: json("error")
  },
  table => [index("idx_job_user_queue_date").on(table.userId, table.queueDate)]
);

export const queryResultSetTable = dataset.table("query_result_set", {
  id: int("id").autoincrement().notNull().primaryKey(),
  startTime: datetime("start_time", { mode: "string" }).notNull(),
  endTime: datetime("end_time", { mode: "string" }),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  searchDate: date("search_date", { mode: "string" }),
  achievementDate: date("achievement_date", { mode: "string" }),
  jobId: int("job_id").notNull()
});

export const indicatorResultTable = dataset.table("indicator_result", {
  id: int("id").autoincrement().notNull().primaryKey(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  queryResultSetId: int("query_result_set_id"),
  searchDate: date("search_date"),
  achievementDate: date("achievement_date"),
  startTime: datetime("start_time", { mode: "string" }),
  endTime: datetime("end_time", { mode: "string" }),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  version: int("version").notNull()
});

export const queryResultTable = dataset.table(
  "query_result",
  {
    id: int("id").autoincrement().notNull().primaryKey(),
    queryIri: varchar("query_iri", { length: 255 }).notNull(),
    queryResultSetId: int("query_result_set_id"),
    indicatorResultId: int("indicator_result_id"),
    searchDate: date("search_date"),
    achievementDate: date("achievement_date"),
    startTime: datetime("start_time", { mode: "string" }),
    endTime: datetime("end_time", { mode: "string" }),
    startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
    persistent: tinyint("persistent").notNull(),
    useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
    executedSQL: text("executed_sql"),
    version: int("version").notNull(),
    queryType: varchar("query_type", { length: 255 }).$type<IMQType>().notNull()
  },
  table => [index("idx_query_result_set_iri").on(table.queryResultSetId, table.queryIri)]
);

export const datasetResultsTable = dataset.table("dataset_results", {
  queryResultId: int("query_result_id").notNull(),
  entityId: int("entity_id").notNull(),
  columnGroup: varchar("column_group", { length: 255 }).notNull(),
  json: json("json").notNull(),
  entityOrgId: int("entity_org_id").notNull()
});

export const cohortResultsTable = dataset.table("cohort_results", {
  queryResultId: int("query_result_id").notNull(),
  entityId: int("entity_id").notNull(),
  entityOrgId: int("entity_org_id").notNull()
});

export const patientExistsTable = dataset.table(
  "patient_exists",
  {
    queryIri: varchar("query_iri", { length: 512 }).notNull(),
    patientId: varchar("patient_id", { length: 64 }).notNull(),
    stepNo: int("step_no").notNull(),
    cteName: varchar("cte_name", { length: 128 }).notNull(),
    patientFound: tinyint("patient_found").notNull()
  },
  table => [index("idx_patient_exists_iri_patient").on(table.queryIri, table.patientId)]
);

export const organization = mysqlTable("organization", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  odsCode: varchar("ods_code", { length: 50 }),
  name: varchar("name", { length: 255 }),
  typeCode: varchar("type_code", { length: 50 }),
  typeDesc: varchar("type_desc", { length: 255 }),
  postcode: varchar("postcode", { length: 10 }),
  parentOrganizationId: bigint("parent_organization_id", { mode: "number" })
});
