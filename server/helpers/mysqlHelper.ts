import { JobStatus } from "~~/enums";
import { type JobRequest } from "~~/models/JobRequest";
import { type IndicatorResult } from "~~/models/indicatorResult.schema";
import { type Job } from "~~/models/job.schema";
import { type QueryResult } from "~~/models/queryResult.schema";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

import { IMQType, type QueryRequest } from "@endeavour/vue-library";

import { eq } from "drizzle-orm";
import { type MySqlTableWithColumns } from "drizzle-orm/mysql-core";

import { mysqlDb } from "../db/mysql";
import { indicatorResultTable, jobTable, queryResultSetTable, queryResultTable } from "../db/mysql/schema";
import QueryService from "../services/QueryService";
import { resolveArgs } from "../utils/executeQuery";

export async function createJobEntry(jobRequest: JobRequest, sessionId: string, userId: string): Promise<Job> {
  const queryRequestsForSql = [];
  for (const queryRequest of jobRequest.queryRequests) {
    const getQueryRequestForSQL = await QueryService.getQueryRequestForSQL(sessionId!, queryRequest);
    resolveArgs(getQueryRequestForSQL);
    queryRequestsForSql.push(getQueryRequestForSQL);
  }
  const now = getNow();
  const queryJob = {
    jobName: jobRequest.jobName || queryRequestsForSql[0]?.query?.name || "Unnamed Job",
    queryRequests: queryRequestsForSql,
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
  return queryJob;
}

export async function getJobById(jobId: number): Promise<Job> {
  const jobs = await mysqlDb.select().from(jobTable).where(eq(jobTable.id, jobId));
  const job = jobs[0];
  if (!job) {
    throw new Error("Could not find job with id: " + jobId);
  }
  return job;
}

export async function updateJobStatus(jobId: number, jobStatus: JobStatus, error: any = null) {
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
      set.error = error;
      if (error) {
        const parsedError = JSON.parse(error);
        if (parsedError.cause?.sqlMessage === "Query execution was interrupted") {
          set.status = JobStatus.CANCELLED;
          console.info(parsedError.cause?.sqlMessage, `(Job ID: ${jobId} CANCELLED)`);
        } else {
          console.error(`Error executing query for job ID: ${jobId}`);
          console.error(error);
        }
      }
      break;
    default:
      throw new Error(`Invalid job status: ${jobStatus}`);
  }
  await mysqlDb.update(jobTable).set(set).where(eq(jobTable.id, jobId));
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
  console.log("Inserted query result set with id:", queryResultSet.id, "for job id:", job.id);
  return queryResultSet;
}

export async function createQueryResultEntry(queryRequest: QueryRequest, queryResultSet: QueryResultSet, hashCodeVersion: number, indicatorId?: number) {
  switch (queryRequest.query.queryType) {
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
        version: hashCodeVersion
      } as QueryResult;
      const result = await mysqlDb.insert(queryResultTable).values(queryResult);
      return result?.[0]?.insertId;

    default:
      throw new Error("Unsupported query type: " + queryRequest.query.queryType);
  }
}

export async function createIndicatorResultEntry(queryRequest: QueryRequest, queryResultSet: QueryResultSet, hashCodeVersion: number) {
  const indicatorResult = {
    startOfDaySnapshot: queryResultSet.startOfDaySnapshot,
    persistent: queryResultSet.persistent,
    useStartOfDaySnapshot: queryResultSet.useStartOfDaySnapshot,
    startTime: getNow(),
    queryIri: queryRequest.query.iri,
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

export function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getNow() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
