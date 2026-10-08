import { emitQueueUpdate } from "#server/utils/queueEvents.ts";
import Logger from "#shared/logger";
import { ErrorCode, JobStatus } from "~~/enums";
import { type JobRequest } from "~~/models/JobRequest";
import { type IndicatorResult } from "~~/models/indicatorResult.schema";
import { type Job } from "~~/models/job.schema";
import { type QueryResult } from "~~/models/queryResult.schema";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

import { isArrayHasLength } from "@endeavour/vue-library";
import { IMQType } from "@endeavour/vue-library/enums";
import { type QueryRequest } from "@endeavour/vue-library/models";

import { and, asc, count, eq, inArray } from "drizzle-orm";
import { type MySqlTableWithColumns } from "drizzle-orm/mysql-core";

import { mysqlDb } from "../db/mysql";
import {
  cohortResultsTable,
  datasetResultsTable,
  indicatorResultTable,
  jobTable,
  patientExistsTable,
  queryResultSetTable,
  queryResultTable
} from "../db/mysql/schema";
import QueryService from "../services/QueryService";
import { resolveArgs, sortQueryRequestsByDependency } from "../utils/executeQuery";
import { TtlCache } from "../utils/memoryCache";

const LOG = Logger("server/helpers/mysqlHelper");

export async function createJobEntry(jobRequest: JobRequest, accessToken: string, userId: string): Promise<Job> {
  const queryRequestsForSql = [];
  for (const queryRequest of jobRequest.queryRequests) {
    const getQueryRequestForSQL = await QueryService.getQueryRequestForSQL(accessToken!, queryRequest);
    resolveArgs(getQueryRequestForSQL);
    queryRequestsForSql.push(getQueryRequestForSQL);
  }
  const orderedQueryRequests = await sortQueryRequestsByDependency(accessToken!, queryRequestsForSql);
  const now = getNow();
  const queryJob = {
    jobName: jobRequest.jobName || queryRequestsForSql[0]?.query?.name || "Unnamed Job",
    queryRequests: orderedQueryRequests,
    startOfDaySnapshot: jobRequest.startOfDaySnapshot ? 1 : 0,
    persistent: jobRequest.persistent ? 1 : 0,
    useStartOfDaySnapshot: jobRequest.useStartOfDaySnapshot ? 1 : 0,
    userId: userId,
    queueDate: now,
    status: JobStatus.QUEUED,
    error: null
  } as Job;

  const result = await mysqlDb.insert(jobTable).values(queryJob);
  if (!result?.[0]?.insertId) throw new Error("Failed to insert job into database");
  queryJob.id = result[0].insertId;
  emitQueueUpdate(userId, { jobId: queryJob.id, status: JobStatus.QUEUED });
  return queryJob;
}

export async function getJobById(jobId: number): Promise<Job> {
  const jobs = await mysqlDb.select().from(jobTable).where(eq(jobTable.id, jobId));
  const job = jobs[0];
  if (!job) {
    throw createError({ status: 400, statusText: ErrorCode.MissingDataError, message: "Queue job not found" });
  }
  return job;
}

/**
 * Loads a job only if it belongs to `userId`. A job owned by someone else is reported as not found (404),
 * so job ids cannot be probed. Use this for anything reachable from the API; `getJobById` is for the queue consumer.
 */
export async function getJobForUser(jobId: number, userId: string): Promise<Job> {
  const jobs = await mysqlDb
    .select()
    .from(jobTable)
    .where(and(eq(jobTable.id, jobId), eq(jobTable.userId, userId)));
  const job = jobs[0];
  if (!job) {
    throw createError({ status: 404, statusText: ErrorCode.MissingDataError, message: "Queue job not found" });
  }
  return job;
}

/** Loads the jobs in `jobIds` that belong to `userId`, in one query. Ids that are missing or owned by someone else are simply absent. */
export async function getJobsForUser(jobIds: number[], userId: string): Promise<Job[]> {
  if (!jobIds.length) return [];
  return mysqlDb
    .select()
    .from(jobTable)
    .where(and(inArray(jobTable.id, jobIds), eq(jobTable.userId, userId)));
}

/** Rows removed per statement when clearing result tables, so a large cohort never holds one long lock. */
export const DELETE_BATCH_SIZE = 10000;

async function deleteResultRowsInBatches(table: typeof cohortResultsTable | typeof datasetResultsTable, queryResultIds: number[]) {
  while (true) {
    const [header] = await mysqlDb.delete(table).where(inArray(table.queryResultId, queryResultIds)).limit(DELETE_BATCH_SIZE);
    if (header.affectedRows < DELETE_BATCH_SIZE) return;
  }
}

/**
 * Deletes a job and everything it produced (result rows, results, indicator results, result sets).
 * The bulk result rows are removed in batches first; each batch is its own statement and the job still exists
 * until the end, so a failure part-way can simply be retried. The remaining metadata is removed in one transaction.
 * A RUNNING job is refused because the worker is still writing to it: cancel it first.
 */
export async function deleteJobData(job: Job) {
  if (job.status === JobStatus.RUNNING) {
    throw createError({ status: 409, statusText: ErrorCode.InvalidRequestError, message: "Cancel the job before deleting it" });
  }

  const resultSetIds = (await mysqlDb.select({ id: queryResultSetTable.id }).from(queryResultSetTable).where(eq(queryResultSetTable.jobId, job.id))).map(
    r => r.id
  );

  if (resultSetIds.length) {
    const queryResultIds = (
      await mysqlDb.select({ id: queryResultTable.id }).from(queryResultTable).where(inArray(queryResultTable.queryResultSetId, resultSetIds))
    ).map(r => r.id);

    if (queryResultIds.length) {
      await deleteResultRowsInBatches(cohortResultsTable, queryResultIds);
      await deleteResultRowsInBatches(datasetResultsTable, queryResultIds);
    }
  }

  // Child tables first: query_result references indicator_result and query_result_set, indicator_result references query_result_set
  await mysqlDb.transaction(async tx => {
    if (resultSetIds.length) {
      await tx.delete(queryResultTable).where(inArray(queryResultTable.queryResultSetId, resultSetIds));
      await tx.delete(indicatorResultTable).where(inArray(indicatorResultTable.queryResultSetId, resultSetIds));
      await tx.delete(queryResultSetTable).where(inArray(queryResultSetTable.id, resultSetIds));
    }
    await tx.delete(jobTable).where(eq(jobTable.id, job.id));
  });
}

export async function getQueryResultSetRows(job: Job) {
  if (job.status !== JobStatus.COMPLETED) return [];
  const queryResultSetRows = await mysqlDb.select().from(queryResultSetTable).where(eq(queryResultSetTable.jobId, job.id));
  if (!isArrayHasLength(queryResultSetRows)) {
    throw createError({ statusCode: 400, statusText: ErrorCode.MissingDataError, message: "Query result set not found" });
  }
  return queryResultSetRows;
}

/** Row counts of completed results. Keyed by result id only, so callers must check job ownership before asking for a page. */
const resultCountCache = new TtlCache<number>(10 * 60 * 1000, 1000);

export interface PagedResults {
  result: any[];
  totalCount: number;
  page: number;
}

/**
 * Id of the result for `queryIri` in a job, taken from the earliest result set that has one. Joins through
 * query_result_set in a single query rather than loading the result sets first.
 */
export async function getQueryResultIdForJob(jobId: number, queryIri: string): Promise<number | undefined> {
  const rows = await mysqlDb
    .select({ id: queryResultTable.id })
    .from(queryResultTable)
    .innerJoin(queryResultSetTable, eq(queryResultTable.queryResultSetId, queryResultSetTable.id))
    .where(and(eq(queryResultSetTable.jobId, jobId), eq(queryResultTable.queryIri, queryIri)))
    .orderBy(asc(queryResultSetTable.id), asc(queryResultTable.id))
    .limit(1);
  return rows[0]?.id;
}

export async function getDebugResultsPaged(queryIri: string, patientId: string, page: number = 1, size: number = 25): Promise<PagedResults> {
  const whereClause = and(eq(patientExistsTable.queryIri, queryIri), eq(patientExistsTable.patientId, patientId));
  const [result, totalResult] = await Promise.all([
    mysqlDb
      .select()
      .from(patientExistsTable)
      .where(whereClause)
      .limit(size)
      .offset((page - 1) * size),
    mysqlDb.select({ count: count() }).from(patientExistsTable).where(whereClause)
  ]);
  // Debug rows are rewritten each time the debug query runs, so the count is never cached
  return { result, totalCount: totalResult[0]?.count ?? 0, page };
}

/** One page of a completed COHORT or DATASET result. Row and count queries run together; the count is cached because a completed result never changes. */
export async function getQueryResultsPaged(queryResultId: number, queryType: IMQType, page: number = 1, size: number = 25): Promise<PagedResults> {
  const offset = (page - 1) * size;
  const table = queryType === IMQType.COHORT ? cohortResultsTable : queryType === IMQType.DATASET ? datasetResultsTable : undefined;
  if (!table) return { result: [], totalCount: 0, page };

  const whereClause = eq(table.queryResultId, queryResultId);
  const [result, totalCount] = await Promise.all([
    mysqlDb.select().from(table).where(whereClause).limit(size).offset(offset),
    resultCountCache.getOrLoad(
      `${queryType}:${queryResultId}`,
      async () => (await mysqlDb.select({ count: count() }).from(table).where(whereClause))[0]?.count ?? 0
    )
  ]);
  return { result, totalCount, page };
}

export async function getQueryResultRow(queryResultSetId: number, queryIri: string) {
  const queryResultRows = await mysqlDb
    .select()
    .from(queryResultTable)
    .where(and(eq(queryResultTable.queryIri, queryIri), eq(queryResultTable.queryResultSetId, queryResultSetId)));
  if (!isArrayHasLength(queryResultRows))
    throw createError({ status: 400, statusText: ErrorCode.MissingDataError, message: `Query result not found for query ${queryIri}` });
  return queryResultRows[0];
}

export async function getQueryResultSQL(queryResultSetId: number, queryIri: string) {
  const queryResultRows = await mysqlDb
    .select({ executedSql: queryResultTable.executedSQL })
    .from(queryResultTable)
    .where(and(eq(queryResultTable.queryIri, queryIri), eq(queryResultTable.queryResultSetId, queryResultSetId)));
  if (!isArrayHasLength(queryResultRows))
    throw createError({ status: 400, statusText: ErrorCode.MissingDataError, message: `Query result not found for query ${queryIri}` });
  return queryResultRows[0].executedSql ?? "";
}

export async function updateJobStatus(jobId: number, jobStatus: JobStatus, userId: string, error: any = null) {
  const now = getNow();
  const set = {
    status: jobStatus
  } as Job;
  switch (jobStatus) {
    case JobStatus.RUNNING:
      set.runDate = now;
      break;
    case JobStatus.CANCELLED:
      set.finishDate = now;
      break;
    case JobStatus.COMPLETED:
      set.finishDate = now;
      break;
    case JobStatus.ERRORED:
      set.finishDate = now;
      set.error =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              cause: (error as any).cause ?? null
            }
          : typeof error === "string"
            ? { message: error }
            : (error as any);
      break;
    default:
      throw new Error(`Invalid job status: ${jobStatus}`);
  }
  await mysqlDb.update(jobTable).set(set).where(eq(jobTable.id, jobId));
  emitQueueUpdate(userId, { jobId, status: jobStatus });
}

export async function createResultSetEntry(queryRequest: any, job: Job): Promise<QueryResultSet> {
  const queryResultSet = {
    startOfDaySnapshot: queryRequest.startOfDaySnapshot ? 1 : 0,
    persistent: queryRequest.persistent ? 1 : 0,
    useStartOfDaySnapshot: queryRequest.useStartOfDaySnapshot ? 1 : 0,
    userId: job.userId, // probably not needed
    startTime: getNow(),
    jobId: job.id,
    queryIri: queryRequest.query.iri,
    searchDate: queryRequest?.searchDate as any,
    achievementDate: queryRequest?.achievementDate as any
  } as QueryResultSet;

  const result = await mysqlDb.insert(queryResultSetTable).values(queryResultSet);
  const queryResultSetId = result?.[0]?.insertId;
  queryResultSet.id = queryResultSetId!;
  LOG.debug(`Inserted query result set ${queryResultSet.id} for job ${job.id}`);
  return queryResultSet;
}

export async function createQueryResultEntry(queryRequest: QueryRequest, queryResultSet: QueryResultSet, hashCodeVersion: number, indicatorId?: number) {
  switch (queryRequest.query?.queryType) {
    case IMQType.COHORT:
    case IMQType.DATASET:
      const queryResult = {
        startOfDaySnapshot: queryResultSet.startOfDaySnapshot,
        persistent: queryResultSet.persistent,
        useStartOfDaySnapshot: queryResultSet.useStartOfDaySnapshot,
        startTime: getNow(),
        queryIri: queryRequest.query.iri,
        searchDate: queryResultSet.searchDate ? new Date(queryResultSet.searchDate) : null,
        achievementDate: queryResultSet.achievementDate ? new Date(queryResultSet.achievementDate) : null,
        indicatorResultId: indicatorId,
        queryResultSetId: queryResultSet.id,
        version: hashCodeVersion,
        queryType: queryRequest.query.queryType
      } as QueryResult;
      const result = await mysqlDb.insert(queryResultTable).values(queryResult);
      return result?.[0]?.insertId;

    default:
      throw new Error("Unsupported query type: " + queryRequest.query?.queryType);
  }
}

export async function createIndicatorResultEntry(queryRequest: QueryRequest, queryResultSet: QueryResultSet, hashCodeVersion: number) {
  const indicatorResult = {
    startOfDaySnapshot: queryResultSet.startOfDaySnapshot,
    persistent: queryResultSet.persistent,
    useStartOfDaySnapshot: queryResultSet.useStartOfDaySnapshot,
    startTime: getNow(),
    queryIri: queryRequest.query?.iri,
    searchDate: queryResultSet.searchDate ? new Date(queryResultSet.searchDate) : null,
    achievementDate: queryResultSet.achievementDate ? new Date(queryResultSet.achievementDate) : null,
    queryResultSetId: queryResultSet.id,
    version: hashCodeVersion
  } as IndicatorResult;
  const result = await mysqlDb.insert(indicatorResultTable).values(indicatorResult);
  return result?.[0]?.insertId;
}

export async function updateWithEndTime(id: number, table: MySqlTableWithColumns<any>) {
  await mysqlDb
    .update(table)
    .set({
      endTime: getNow()
    })
    .where(eq(table.id, id));
}

export async function updateWithSQL(id: number, table: MySqlTableWithColumns<any>, sql: string) {
  await mysqlDb
    .update(table)
    .set({
      executedSQL: sql
    })
    .where(eq(table.id, id));
}

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getNow() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
