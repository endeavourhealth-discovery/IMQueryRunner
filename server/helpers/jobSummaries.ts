import { ErrorCode, JobStatus } from "~~/enums";
import type { QueryResultSummary } from "~~/models";
import type { Job } from "~~/models/job.schema";

import { IMQType } from "@endeavour/vue-library/enums";

import { asc, count, inArray } from "drizzle-orm";

import { mysqlDb } from "../db/mysql";
import { cohortResultsTable, datasetResultsTable, indicatorResultTable, queryDependencyTable, queryResultSetTable, queryResultTable } from "../db/mysql/schema";
import EntityService from "../services/EntityService";
import QueryService from "../services/QueryService";
import { TtlCache, createLimiter } from "../utils/memoryCache";

/** IMAPI calls in flight at once for a single request. */
const IMAPI_CONCURRENCY = 5;
const LOOKUP_TTL_MS = 5 * 60 * 1000;
const LOOKUP_MAX_ENTRIES = 5000;

// Entity names and query dependencies change rarely. Keys include the user id because IMAPI answers
// with that user's token, so one user's view of an entity is never served to another.
const entityNameCache = new TtlCache<string>(LOOKUP_TTL_MS, LOOKUP_MAX_ENTRIES);
const subQueryIriCache = new TtlCache<string[]>(LOOKUP_TTL_MS, LOOKUP_MAX_ENTRIES);

export interface JobSummaryResult {
  job: Job;
  summaries: QueryResultSummary[];
  /** Set when this job's summaries could not be built. Other jobs in the batch are unaffected. */
  error?: unknown;
}

function createLookups(accessToken: string, userId: string) {
  const limit = createLimiter(IMAPI_CONCURRENCY);

  const entityName = (iri: string) =>
    entityNameCache.getOrLoad(`${userId}|${iri}`, () => limit(async () => (await EntityService.getEntitySummary(accessToken, iri)).name ?? ""));

  const subQueryIris = (iri: string, isIndicator: boolean) =>
    subQueryIriCache.getOrLoad(`${userId}|${isIndicator}|${iri}`, () =>
      limit(async () =>
        (await QueryService.getSubqueryIris(accessToken, iri, isIndicator)).map(subQuery => subQuery.iri).filter((subIri): subIri is string => !!subIri)
      )
    );

  return { entityName, subQueryIris };
}

type Lookups = ReturnType<typeof createLookups>;

async function getJobSubQueryIris(lookups: Lookups, job: Job): Promise<Map<string, string[]>> {
  const byQueryIri = new Map<string, string[]>();
  await Promise.all(
    job.queryRequests.map(async queryRequest => {
      const queryIri = queryRequest.query?.iri;
      if (!queryIri) return;
      const isIndicator = queryRequest.query?.queryType === IMQType.INDICATOR;
      const subQueryIris = [...(await lookups.subQueryIris(queryIri, isIndicator))];
      if (isIndicator) {
        const nested = await Promise.all(subQueryIris.map(indicatorSubQueryIri => lookups.subQueryIris(indicatorSubQueryIri, false)));
        for (const iris of nested) subQueryIris.push(...iris);
      }
      byQueryIri.set(
        queryIri,
        [...new Set(subQueryIris)].filter(iri => iri !== queryIri)
      );
    })
  );
  return byQueryIri;
}

function countsById(rows: { id: number | null; total: number }[]): Map<number, number> {
  return new Map(rows.filter((row): row is { id: number; total: number } => row.id !== null).map(row => [row.id, row.total]));
}

/** An indicator has no status of its own, so it follows its results (every result in its result set) and its job. */
function indicatorStatus(indicator: { endTime: Date | null }, rows: { status: JobStatus }[], job: Job): JobStatus {
  if (indicator.endTime) return JobStatus.COMPLETED;
  if (rows.some(row => row.status === JobStatus.ERRORED)) return JobStatus.ERRORED;
  if (rows.some(row => row.status === JobStatus.RUNNING)) return JobStatus.RUNNING;
  if (job.status === JobStatus.ERRORED || job.status === JobStatus.CANCELLED) return JobStatus.CANCELLED;
  return rows.some(row => row.status === JobStatus.COMPLETED) ? JobStatus.RUNNING : JobStatus.QUEUED;
}

/**
 * Builds result summaries for several jobs at once. The database is hit a fixed number of times however many jobs
 * there are (result sets, result rows, then one grouped count per result table and the sub query links), and each distinct IMAPI lookup is made at most once.
 * A QUEUED job has no results yet so gets an empty summary list. Only COMPLETED results are counted: the others have no total yet. A job
 * that fails gets `error` set without affecting the others.
 */
export async function getJobsResultSummaries(accessToken: string, userId: string, jobs: Job[]): Promise<JobSummaryResult[]> {
  const startedJobIds = jobs.filter(job => job.status !== JobStatus.QUEUED).map(job => job.id);

  const resultSets = startedJobIds.length
    ? await mysqlDb.select().from(queryResultSetTable).where(inArray(queryResultSetTable.jobId, startedJobIds)).orderBy(asc(queryResultSetTable.id))
    : [];
  const resultSetIds = resultSets.map(set => set.id);

  const resultRows = resultSetIds.length
    ? await mysqlDb.select().from(queryResultTable).where(inArray(queryResultTable.queryResultSetId, resultSetIds)).orderBy(asc(queryResultTable.id))
    : [];

  const idsOfType = (type: IMQType) => resultRows.filter(row => row.queryType === type && row.status === JobStatus.COMPLETED).map(row => row.id);
  const cohortIds = idsOfType(IMQType.COHORT);
  const datasetIds = idsOfType(IMQType.DATASET);
  const indicatorSetIds = [...new Set(resultRows.filter(row => row.queryType === IMQType.INDICATOR).map(row => row.queryResultSetId!))];

  const [cohortCounts, datasetCounts, indicatorCounts, dependencies, indicatorResults] = await Promise.all([
    cohortIds.length
      ? mysqlDb
          .select({ id: cohortResultsTable.queryResultId, total: count() })
          .from(cohortResultsTable)
          .where(inArray(cohortResultsTable.queryResultId, cohortIds))
          .groupBy(cohortResultsTable.queryResultId)
      : [],
    datasetIds.length
      ? mysqlDb
          .select({ id: datasetResultsTable.queryResultId, total: count() })
          .from(datasetResultsTable)
          .where(inArray(datasetResultsTable.queryResultId, datasetIds))
          .groupBy(datasetResultsTable.queryResultId)
      : [],
    indicatorSetIds.length
      ? mysqlDb
          .select({ id: indicatorResultTable.queryResultSetId, total: count() })
          .from(indicatorResultTable)
          .where(inArray(indicatorResultTable.queryResultSetId, indicatorSetIds))
          .groupBy(indicatorResultTable.queryResultSetId)
      : [],
    resultRows.length
      ? mysqlDb
          .select()
          .from(queryDependencyTable)
          .where(
            inArray(
              queryDependencyTable.parentQueryResultId,
              resultRows.map(row => row.id)
            )
          )
      : [],
    resultSetIds.length ? mysqlDb.select().from(indicatorResultTable).where(inArray(indicatorResultTable.queryResultSetId, resultSetIds)) : []
  ]);
  const cohortCountById = countsById(cohortCounts);
  const datasetCountById = countsById(datasetCounts);
  const indicatorCountBySetId = countsById(indicatorCounts);
  const subQueryResultIdsById = new Map(
    [...Map.groupBy(dependencies, dependency => dependency.parentQueryResultId)].map(([id, links]) => [id, links.map(link => link.subQueryResultId)])
  );

  const setsByJobId = Map.groupBy(resultSets, set => set.jobId);
  const rowsBySetId = Map.groupBy(resultRows, row => row.queryResultSetId);
  const indicatorsBySetId = Map.groupBy(indicatorResults, indicator => indicator.queryResultSetId);
  const lookups = createLookups(accessToken, userId);

  return Promise.all(
    jobs.map(async (job): Promise<JobSummaryResult> => {
      if (job.status === JobStatus.QUEUED) return { job, summaries: [] };
      // Only a completed job must have results: any other can have stopped, or not yet got to them
      const isCompleted = job.status === JobStatus.COMPLETED;
      try {
        const jobSets = setsByJobId.get(job.id) ?? [];
        if (isCompleted && !jobSets.length)
          throw createError({ statusCode: 400, statusText: ErrorCode.MissingDataError, message: "Query result set not found" });

        const subQueryIrisByQueryIri = await getJobSubQueryIris(lookups, job);
        const summaries: QueryResultSummary[] = [];
        for (const resultSet of jobSets) {
          const rows = rowsBySetId.get(resultSet.id) ?? [];
          if (isCompleted && !rows.length) throw createError({ status: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });

          const indicators = indicatorsBySetId.get(resultSet.id) ?? [];
          const indicatorNames = await Promise.all(indicators.map(indicator => lookups.entityName(indicator.queryIri)));
          indicators.forEach((indicator, index) => {
            const summary: QueryResultSummary = {
              indicatorResultId: indicator.id,
              totalCount: null,
              queryName: indicatorNames[index]!,
              queryIri: indicator.queryIri,
              queryType: IMQType.INDICATOR,
              status: indicatorStatus(indicator, rows, job),
              startTime: indicator.startTime,
              endTime: indicator.endTime
            };
            const subQueryIris = subQueryIrisByQueryIri.get(indicator.queryIri);
            if (subQueryIris) summary.subQueryIris = subQueryIris;
            summaries.push(summary);
          });

          const names = await Promise.all(rows.map(row => lookups.entityName(row.queryIri)));
          rows.forEach((row, index) => {
            let totalCount: number | null;
            switch (row.queryType) {
              case IMQType.COHORT:
                totalCount = cohortCountById.get(row.id) ?? 0;
                break;
              case IMQType.DATASET:
                totalCount = datasetCountById.get(row.id) ?? 0;
                break;
              case IMQType.INDICATOR:
                totalCount = indicatorCountBySetId.get(resultSet.id) ?? 0;
                break;
              default:
                throw createError({ status: 400, statusText: ErrorCode.InvalidRequestError, message: "Query type is invalid" });
            }
            if (row.status !== JobStatus.COMPLETED) totalCount = null;
            const summary: QueryResultSummary = {
              queryResultId: row.id,
              totalCount,
              queryName: names[index]!,
              queryIri: row.queryIri,
              queryType: row.queryType,
              status: row.status,
              startTime: row.startTime,
              endTime: row.endTime
            };
            const subQueryIris = subQueryIrisByQueryIri.get(row.queryIri);
            if (subQueryIris) summary.subQueryIris = subQueryIris;
            const subQueryResultIds = subQueryResultIdsById.get(row.id);
            if (subQueryResultIds) summary.subQueryResultIds = subQueryResultIds;
            if (row.indicatorResultId !== null) summary.indicatorResultId = row.indicatorResultId;
            summaries.push(summary);
          });
        }
        return { job, summaries };
      } catch (error) {
        return { job, summaries: [], error };
      }
    })
  );
}

export function errorMessage(error: unknown): string {
  return (error as { message?: string })?.message ?? String(error);
}
