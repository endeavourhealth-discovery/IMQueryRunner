import { emitQueueUpdate } from "#server/utils/queueEvents.ts";
import { ErrorCode, JobStatus } from "~~/enums";
import { type QueryResultSummary } from "~~/models";
import { type JobRequest } from "~~/models/JobRequest";
import { type IndicatorResult } from "~~/models/indicatorResult.schema";
import { type Job } from "~~/models/job.schema";
import { type QueryResult } from "~~/models/queryResult.schema";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

import { isArrayHasLength } from "@endeavour/vue-library";
import { IMQType } from "@endeavour/vue-library/enums";
import { type QueryRequest } from "@endeavour/vue-library/models";

import { and, count, eq } from "drizzle-orm";
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
import EntityService from "../services/EntityService";
import QueryService from "../services/QueryService";
import { resolveArgs, sortQueryRequestsByDependency } from "../utils/executeQuery";

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
  emitQueueUpdate(userId);
  if (!result?.[0]?.insertId) throw new Error("Failed to insert job into database");
  queryJob.id = result[0].insertId;
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

export async function getQueryResultSetRows(job: Job) {
  if (job.status !== JobStatus.COMPLETED) return [];
  const queryResultSetRows = await mysqlDb.select().from(queryResultSetTable).where(eq(queryResultSetTable.jobId, job.id));
  if (!isArrayHasLength(queryResultSetRows)) {
    throw createError({ statusCode: 400, statusText: ErrorCode.MissingDataError, message: "Query result set not found" });
  }
  return queryResultSetRows;
}

export async function getQueryResultsPaged(
  queryIri: string,
  queryResultSetId: number,
  queryType: IMQType,
  page: number = 1,
  size: number = 25,
  debugPatientId?: string
) {
  const offset = (page - 1) * size;
  const returnObject = {
    result: [] as any[],
    totalCount: 0,
    page: page
  };
  if (debugPatientId) {
    const whereClause = and(eq(patientExistsTable.queryIri, queryIri), eq(patientExistsTable.patientId, debugPatientId));
    const debugResults = await mysqlDb.select().from(patientExistsTable).where(whereClause).limit(size).offset(offset);
    const totalResult = await mysqlDb.select({ count: count() }).from(patientExistsTable).where(whereClause);
    returnObject.result = debugResults;
    returnObject.totalCount = totalResult[0]?.count ?? 0;
    return returnObject;
  }

  if (queryType === IMQType.INDICATOR) {
    const indicatorResultRows = await mysqlDb
      .select()
      .from(indicatorResultTable)
      .where(and(eq(indicatorResultTable.queryIri, queryIri), eq(indicatorResultTable.queryResultSetId, queryResultSetId)));
    const indicatorResult = indicatorResultRows[0];
    // TODO: return indicator results - get sql from imapi
    return returnObject;
  } else {
    const queryResultRows = await mysqlDb
      .select()
      .from(queryResultTable)
      .where(and(eq(queryResultTable.queryIri, queryIri), eq(queryResultTable.queryResultSetId, queryResultSetId)));
    const queryResult = queryResultRows[0];

    if (!queryResult) {
      throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
    }

    if (queryType === IMQType.COHORT) {
      const whereClause = eq(cohortResultsTable.queryResultId, queryResult.id);
      const cohortResults = await mysqlDb.select().from(cohortResultsTable).where(whereClause).limit(size).offset(offset);
      const totalResult = await mysqlDb.select({ count: count() }).from(cohortResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = cohortResults;
      returnObject.totalCount = totalCount;
    } else if (queryType === IMQType.DATASET) {
      const whereClause = eq(datasetResultsTable.queryResultId, queryResult.id);
      const datasetResults = await mysqlDb.select().from(datasetResultsTable).where(whereClause).limit(size).offset(offset);
      const totalResult = await mysqlDb.select({ count: count() }).from(datasetResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = datasetResults;
      returnObject.totalCount = totalCount;
    }
  }
  return returnObject;
}

export async function getQueryResultRows(queryResultSetId: number) {
  const queryResultRows = await mysqlDb.select().from(queryResultTable).where(eq(queryResultTable.queryResultSetId, queryResultSetId));
  if (!isArrayHasLength(queryResultRows)) throw createError({ status: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
  return queryResultRows;
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

export async function getQueryResultSummary(accessToken: string, queryResultSetId: number, queryResultRowId: number, queryIri: string, queryType: IMQType) {
  const name = (await EntityService.getEntitySummary(accessToken, queryIri)).name ?? "";
  const result = { totalCount: 0, queryName: name, queryIri: queryIri, queryType: queryType };
  if (queryType === IMQType.COHORT) {
    const countResult = await mysqlDb.select({ count: count() }).from(cohortResultsTable).where(eq(cohortResultsTable.queryResultId, queryResultRowId));
    if (isArrayHasLength(countResult)) {
      result.totalCount = countResult[0].count;
    }
  } else if (queryType === IMQType.DATASET) {
    const countResult = await mysqlDb.select({ count: count() }).from(datasetResultsTable).where(eq(datasetResultsTable.queryResultId, queryResultRowId));
    if (isArrayHasLength(countResult)) {
      result.totalCount = countResult[0].count;
    }
  } else if (queryType === IMQType.INDICATOR) {
    const countResult = await mysqlDb.select({ count: count() }).from(indicatorResultTable).where(eq(indicatorResultTable.queryResultSetId, queryResultSetId));
    if (isArrayHasLength(countResult)) {
      result.totalCount = countResult[0].count;
    }
  } else {
    throw createError({ status: 400, statusText: ErrorCode.InvalidRequestError, message: "Query type is invalid" });
  }
  return result;
}

export async function getJobResultSummaries(accessToken: string, job: Job): Promise<QueryResultSummary[]> {
  const results: QueryResultSummary[] = [];
  const queryResultSetRows = await getQueryResultSetRows(job);
  if (!isArrayHasLength(queryResultSetRows)) return results;

  const subQueryIrisByQueryIri = await getJobSubQueryIris(accessToken, job);
  for (const queryResultSet of queryResultSetRows) {
    const queryResultRows = await getQueryResultRows(queryResultSet.id);
    for (const queryResultRow of queryResultRows) {
      const summary: QueryResultSummary = await getQueryResultSummary(
        accessToken,
        queryResultSet.id,
        queryResultRow.id,
        queryResultRow.queryIri,
        queryResultRow.queryType
      );
      const subQueryIris = subQueryIrisByQueryIri.get(queryResultRow.queryIri);
      if (subQueryIris) summary.subQueryIris = subQueryIris;
      results.push(summary);
    }
  }
  return results;
}

async function getJobSubQueryIris(accessToken: string, job: Job): Promise<Map<string, string[]>> {
  const subQueryIrisByQueryIri = new Map<string, string[]>();
  for (const queryRequest of job.queryRequests) {
    const queryIri = queryRequest.query?.iri;
    if (!queryIri) continue;
    const isIndicator = queryRequest.query.queryType === IMQType.INDICATOR;
    const subQueryIris = await getSubQueryIriList(accessToken, queryIri, isIndicator);
    if (isIndicator) {
      for (const indicatorSubQueryIri of [...subQueryIris]) {
        subQueryIris.push(...(await getSubQueryIriList(accessToken, indicatorSubQueryIri)));
      }
    }
    subQueryIrisByQueryIri.set(
      queryIri,
      [...new Set(subQueryIris)].filter(iri => iri !== queryIri)
    );
  }
  return subQueryIrisByQueryIri;
}

async function getSubQueryIriList(accessToken: string, queryIri: string, isIndicator: boolean = false): Promise<string[]> {
  const subQueries = await QueryService.getSubqueryIris(accessToken, queryIri, isIndicator);
  return subQueries.map(subQuery => subQuery.iri).filter((iri): iri is string => !!iri);
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
  emitQueueUpdate(userId);
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
  emitQueueUpdate(job.userId);
  const queryResultSetId = result?.[0]?.insertId;
  queryResultSet.id = queryResultSetId!;
  console.log("Inserted query result set with id:", queryResultSet.id, "for job id:", job.id);
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
