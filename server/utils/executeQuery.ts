import Logger from "#shared/logger";
import { ErrorCode } from "~~/enums";
import type { ResolvedSql } from "~~/models/ResolvedSql.ts";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

import { IMQType } from "@endeavour/vue-library/enums";
import { type Argument, type QueryRequest, type SubQueryDependency } from "@endeavour/vue-library/models";

import { SQL, and, eq, sql } from "drizzle-orm";
import murmurhash from "murmurhash";

import { mysqlDb } from "../db/mysql";
import { patientExistsTable, queryResultSetTable, queryResultTable } from "../db/mysql/schema";
import { createQueryResultEntry, getToday, updateWithEndTime, updateWithSQL } from "../helpers/mysqlHelper";
import QueryService from "../services/QueryService";
import { createLimiter } from "./memoryCache";

const LOG = Logger("server/utils/executeQuery");

/** IMAPI calls in flight at once while preparing one job. */
const IMAPI_CONCURRENCY = 5;

/**
 * Per-job memo of IMAPI lookups, so a sub query shared by several requests in the same job is only fetched once.
 * Deliberately scoped to one job and never kept longer: a later job must see the query definitions as they are then.
 * Create one per job and pass it to every call for that job. Treat the memoised values as read-only.
 */
export interface ExecutionContext {
  subQueries: Map<string, Promise<SubQueryDependency[]>>;
  requests: Map<string, Promise<QueryRequest>>;
  sql: Map<string, Promise<string>>;
  limit: ReturnType<typeof createLimiter>;
}

export function createExecutionContext(): ExecutionContext {
  return { subQueries: new Map(), requests: new Map(), sql: new Map(), limit: createLimiter(IMAPI_CONCURRENCY) };
}

function memo<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  let promise = cache.get(key);
  if (!promise) {
    promise = load();
    cache.set(key, promise);
    // A failed lookup must not be remembered
    promise.catch(() => cache.delete(key));
  }
  return promise;
}

export async function executeQuery(
  accessToken: string,
  sql: string,
  queryRequest: QueryRequest,
  queryResultSet: QueryResultSet,
  ctx: ExecutionContext = createExecutionContext()
) {
  if (!queryRequest.query?.iri) throw new Error("Query IRI is required for execution");
  const hashCodeVersion = hashQueryRequest(queryRequest);
  const existingQueryResultId = await getQueryResultIdIfExists(queryResultSet.id!, hashCodeVersion, queryRequest.query.iri);
  if (existingQueryResultId !== -1) return;

  const queryResultId = await createQueryResultEntry(queryRequest, queryResultSet, hashCodeVersion);

  const debugPatientId = getDebugPatientId(queryRequest);

  const queryIrisToQueryResultIds = {} as { [key: string]: number };
  if (!debugPatientId) queryIrisToQueryResultIds[queryRequest.query.iri] = queryResultId;

  await runSubQueries(accessToken, queryRequest, queryIrisToQueryResultIds, queryResultSet, ctx);

  const resolvedSql = getResolvedSql(sql, queryRequest, queryIrisToQueryResultIds);

  if (debugPatientId) {
    await executeDebugQuery(resolvedSql, queryRequest.query.iri, debugPatientId, queryResultId);
    return;
  }

  switch (queryRequest.query.queryType) {
    case IMQType.DATASET:
      await executeDatasetQuery(sql, queryRequest, queryIrisToQueryResultIds, queryResultId);
      break;
    case IMQType.COHORT:
      await executeCohortQuery(resolvedSql, queryRequest, queryResultId);
      break;
    default:
      throw new Error("Unsupported query type: " + queryRequest.query.queryType);
  }
}

export function getDebugPatientId(queryRequest: QueryRequest): string | undefined {
  return queryRequest.argument?.find(arg => arg.parameter === "$debugPatientId")?.valueData;
}

export async function executeDebugQuery(resolvedSql: ResolvedSql, queryIri: string, patientId: string, queryResultId: number) {
  try {
    await mysqlDb.delete(patientExistsTable).where(and(eq(patientExistsTable.queryIri, queryIri), eq(patientExistsTable.patientId, patientId)));
    await mysqlDb.execute(resolvedSql.query);
    await updateWithEndTime(queryResultId, queryResultTable);
  } catch (err) {
    LOG.error({ err, queryIri }, "Error executing debug query");
    throw err;
  } finally {
    await updateWithSQL(queryResultId, queryResultTable, resolvedSql.displaySql);
  }
}

export async function executeCohortQuery(resolvedSql: ResolvedSql, queryRequest: QueryRequest, queryResultId: number) {
  try {
    await mysqlDb.execute(resolvedSql.query);
    await updateWithEndTime(queryResultId, queryResultTable);
  } catch (err) {
    LOG.error({ err, queryIri: queryRequest.query?.iri }, "Error executing query");
    throw err;
  } finally {
    await updateWithSQL(queryResultId, queryResultTable, resolvedSql.displaySql);
  }
}

export async function executeDatasetQuery(
  querySql: string,
  queryRequest: QueryRequest,
  queryIrisToQueryResultIds: { [key: string]: number },
  queryResultId: number
) {
  const sqlParts = querySql
    .split("----------------------------------------")
    .map(part => part.trim())
    .filter(Boolean);

  let resolvedSqlParts = "";

  LOG.debug(`Dataset parts to run: ${sqlParts.length}`);

  let lastResolvedSql: ResolvedSql | undefined;
  try {
    for (const sqlPart of sqlParts) {
      lastResolvedSql = getResolvedSql(sqlPart, queryRequest, queryIrisToQueryResultIds);
      await mysqlDb.execute(lastResolvedSql.query);
      resolvedSqlParts = resolvedSqlParts + lastResolvedSql.displaySql + "\n";
    }

    await updateWithEndTime(queryResultId, queryResultTable);
  } catch (err) {
    LOG.error({ err, sql: lastResolvedSql?.displaySql }, "Error executing SQL part");
    throw err;
  } finally {
    await updateWithSQL(queryResultId, queryResultTable, resolvedSqlParts ?? querySql);
  }
}

/** Order-independent string identifying a set of arguments. The first part of every query hash, so it must not change. */
function argumentsKey(argument: Argument[] | undefined): string {
  let key = "";
  const sortedArguments = [...(argument ?? [])].sort((a, b) => (a.parameter ?? "").localeCompare(b.parameter ?? ""));
  for (const arg of sortedArguments) {
    key += hashArgument(arg);
  }
  return key;
}

export function hashQueryRequest(queryRequest: QueryRequest): number {
  let argHash = argumentsKey(queryRequest.argument!);
  if (queryRequest.query?.iri) argHash += queryRequest.query.iri;
  return murmurhash.v3(argHash);
}

export function resolveArgs(queryRequest: QueryRequest) {
  if (!queryRequest.argument) queryRequest.argument = [];
  const defaultDates = ["$searchDate", "$achievementDate"];
  for (const date of defaultDates) {
    const hasDate = queryRequest.argument.find(arg => arg.parameter === date);
    if (!hasDate)
      queryRequest.argument.push({
        parameter: date,
        valueData: getToday()
      } as Argument);
  }
}

function hashArgument(argument: Argument): string {
  let hashString = "";
  if (argument.parameter) hashString += argument.parameter;
  if (argument.valueData) hashString += argument.valueData;
  if (argument.valueParameter) hashString += argument.valueParameter;
  if (argument.valueIri) hashString += argument.valueIri;
  if (argument.valueDataList) {
    const sorted = argument.valueDataList.toSorted();
    for (const data of sorted) {
      hashString += data;
    }
  }
  if (argument.valuePath) hashString += argument.valuePath;
  if (argument.valueNodeRef) hashString += argument.valueNodeRef;
  if (argument.dataType) hashString += argument.dataType.iri;
  if (argument.valueIriList) {
    const sorted = argument.valueIriList.toSorted();
    for (const valueIri of sorted) {
      hashString += valueIri.iri;
    }
  }
  if (argument.valueObject) hashString += argument.valueObject;
  if (argument.valueVariable) hashString += argument.valueVariable;
  return hashString;
}

export async function getQueryResultIdIfExists(resultSetId: number, hashCodeVersion: number, iri: string): Promise<number> {
  const results = await mysqlDb
    .select({ id: queryResultTable.id })
    .from(queryResultTable)
    .where(and(eq(queryResultTable.queryResultSetId, resultSetId), eq(queryResultTable.version, hashCodeVersion), eq(queryResultTable.queryIri, iri)))
    .limit(1);
  const result = results[0];
  LOG.debug(`Cache context check (${!!result}): ${resultSetId} with hash: ${hashCodeVersion}, iri: ${iri}.`);
  return result ? result.id! : -1;
}

export async function getQueryResultIdIfExistsInJob(jobId: number, hashCodeVersion: number, iri: string): Promise<number> {
  const results = await mysqlDb
    .select({ id: queryResultTable.id })
    .from(queryResultTable)
    .innerJoin(queryResultSetTable, eq(queryResultTable.queryResultSetId, queryResultSetTable.id))
    .where(and(eq(queryResultSetTable.jobId, jobId), eq(queryResultTable.version, hashCodeVersion), eq(queryResultTable.queryIri, iri)))
    .limit(1);
  const result = results[0];
  LOG.debug(`Job cache context check (${!!result}): job ${jobId} with hash: ${hashCodeVersion}, iri: ${iri}.`);
  return result ? result.id! : -1;
}

async function getSubQueryRequest(accessToken: string, iri: string, argument: Argument[] | undefined, ctx: ExecutionContext): Promise<QueryRequest> {
  return memo(ctx.requests, `${iri}|${argumentsKey(argument)}`, () =>
    ctx.limit(() => QueryService.getQueryRequestForSQL(accessToken, { query: { iri }, argument } as QueryRequest))
  );
}

function getSubQuerySql(accessToken: string, subQueryRequest: QueryRequest, ctx: ExecutionContext): Promise<string> {
  return memo(ctx.sql, `${subQueryRequest.query?.iri}|${argumentsKey(subQueryRequest.argument)}`, () =>
    ctx.limit(() => QueryService.getQuerySql(accessToken, subQueryRequest))
  );
}

async function runSubQueries(
  accessToken: string,
  queryRequest: QueryRequest,
  queryIrisToHashCodes: { [key: string]: number },
  queryResultSet: QueryResultSet,
  ctx: ExecutionContext
) {
  const subQueries = await memo(ctx.subQueries, queryRequest.query!.iri!, () =>
    ctx.limit(() => QueryService.getSubqueryIris(accessToken, queryRequest.query!.iri!))
  );
  LOG.debug(`Subqueries to run: ${subQueries.length}`);
  if (!subQueries.length) return;

  // Looking up what each sub query is does not depend on running the ones before it, so fetch them together.
  // Running them stays strictly in order below: later ones use the result ids of earlier ones.
  const subQueryRequests = await Promise.all(subQueries.map(subQuery => getSubQueryRequest(accessToken, subQuery.iri!, queryRequest.argument, ctx)));

  for (const [index, subQuery] of subQueries.entries()) {
    try {
      const subQueryRequest = subQueryRequests[index]!;
      const hashCodeVersion = hashQueryRequest(subQueryRequest);

      const existingQueryResultId = await getQueryResultIdIfExistsInJob(queryResultSet.jobId, hashCodeVersion, subQueryRequest.query!.iri!);
      if (existingQueryResultId !== -1) {
        queryIrisToHashCodes[subQuery.iri!] = existingQueryResultId;
        continue;
      }

      queryIrisToHashCodes[subQuery.iri!] = await createQueryResultEntry(subQueryRequest, queryResultSet, hashCodeVersion);
      const subQuerySql = await getSubQuerySql(accessToken, subQueryRequest, ctx);
      const resolvedSql = getResolvedSql(subQuerySql, subQueryRequest, queryIrisToHashCodes);
      await executeCohortQuery(resolvedSql, subQueryRequest, queryIrisToHashCodes[subQuery.iri!]!);
    } catch (err: any) {
      LOG.error({ err, subQueryIri: subQuery.iri }, "Error running subquery sql");
      throw err;
    }
  }
}

export async function sortQueryRequestsByDependency(accessToken: string, queryRequests: QueryRequest[]): Promise<QueryRequest[]> {
  const iriToIndex = new Map<string, number>();
  queryRequests.forEach((queryRequest, index) => {
    if (queryRequest.query?.iri) iriToIndex.set(queryRequest.query.iri, index);
  });

  const dependencyIndexes: number[][] = await Promise.all(
    queryRequests.map(async queryRequest => {
      if (!queryRequest.query?.iri) return [];
      const subQueries = await QueryService.getSubqueryIris(accessToken, queryRequest.query.iri);
      return subQueries
        .map((subQuery: SubQueryDependency) => (subQuery.iri ? iriToIndex.get(subQuery.iri) : undefined))
        .filter((index): index is number => index !== undefined);
    })
  );

  const sorted: QueryRequest[] = [];
  const visited = new Set<number>();
  const visiting = new Set<number>();

  function visit(index: number) {
    if (visited.has(index) || visiting.has(index)) return;
    visiting.add(index);
    for (const dependencyIndex of dependencyIndexes[index]!) {
      visit(dependencyIndex);
    }
    visiting.delete(index);
    visited.add(index);
    sorted.push(queryRequests[index]!);
  }

  for (let index = 0; index < queryRequests.length; index++) visit(index);

  return sorted;
}

function getArgumentSql(arg: Argument): SQL {
  if (arg.valueData !== undefined && arg.valueData !== null) return sql`${arg.valueData}`;
  if (arg.valueIri?.iri !== undefined) return sql`${arg.valueIri.iri}`;
  if (arg.valueIriList)
    return sql.join(
      arg.valueIriList.map(value => sql`${value.iri}`),
      sql.raw(" ")
    );
  if (arg.valueDataList)
    return sql`(${sql.join(
      arg.valueDataList.map(value => sql`${value}`),
      sql.raw(", ")
    )})`;

  throw new Error(`Argument ${arg.parameter ?? "<unknown>"} has no supported value`);
}

function getResolvedSql(querySql: string, queryRequest: QueryRequest, queryIrisToHashCodes: { [key: string]: number }): ResolvedSql {
  const replacements = new Map<string, SQL>();
  for (const arg of queryRequest.argument ?? []) {
    if (arg.parameter) replacements.set(arg.parameter, getArgumentSql(arg));
  }

  for (const [iri, queryResultId] of Object.entries(queryIrisToHashCodes)) {
    replacements.set(iri, sql`${queryResultId}`);
  }

  if (replacements.size === 0) {
    return {
      query: sql.raw(querySql),
      displaySql: querySql
    };
  }

  const pattern = new RegExp(
    [...replacements.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|"),
    "g"
  );

  const parts: SQL[] = [];
  let lastIndex = 0;

  for (const match of querySql.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const literal = querySql.slice(lastIndex, index);
      parts.push(sql.raw(literal));
    }

    const replacement = replacements.get(match[0]);

    if (!replacement) throw new Error(`No replacement found for SQL token "${match[0]}"`);

    parts.push(replacement);

    lastIndex = index + match[0].length;
  }

  if (lastIndex < querySql.length) {
    const remaining = querySql.slice(lastIndex);
    parts.push(sql.raw(remaining));
  }

  const formattedString = getSqlString(querySql, queryRequest, queryIrisToHashCodes);

  return { query: sql.join(parts, sql.raw("")), displaySql: formattedString };
}

function getSqlString(querySql: string, queryRequest: QueryRequest, queryIrisToHashCodes: { [key: string]: number }): string {
  if (queryRequest.argument) {
    for (const arg of queryRequest.argument) {
      if (arg.valueData && arg.parameter) querySql = querySql.replaceAll(arg.parameter, `'${arg.valueData}'`);
      else if (arg.valueIri && arg.parameter) querySql = querySql.replaceAll(arg.parameter, `'${arg.valueIri.iri}'`);
      else if (arg.valueIriList && arg.parameter) querySql = querySql.replaceAll(arg.parameter, getIriLine(arg.valueIriList.map(v => v.iri)));
      else if (arg.valueDataList && arg.parameter) querySql = querySql.replaceAll(arg.parameter, `(${arg.valueDataList.map(v => `'${v}'`).join(", ")})`);
    }
  }
  if (Object.keys(queryIrisToHashCodes).length > 0) {
    for (const iri of Object.keys(queryIrisToHashCodes)) {
      querySql = querySql.replaceAll(iri, "" + queryIrisToHashCodes[iri]);
    }
  }
  return querySql;
}

function getIriLine(stringIris: string[]): string {
  for (const stringIri of stringIris) {
    if (stringIri.indexOf(":") === -1) throw createError({ statusCode: 400, statusText: ErrorCode.InvalidRequestError, message: "Invalid iri" });
  }
  return stringIris.join(" ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getValidatedSQL(queryRequest: QueryRequest, accessToken: string, jobId: number): Promise<string> {
  const debugPatientId = getDebugPatientId(queryRequest);
  const sql = debugPatientId
    ? await QueryService.getQuerySqlDebug(accessToken, queryRequest.query!.iri!, debugPatientId)
    : await QueryService.getQuerySql(accessToken, queryRequest);
  if (!sql) {
    throw new Error("Could not generate SQL for query: " + queryRequest?.query?.iri + ", for job: " + jobId);
  }
  return sql;
}

export async function getIndicatorSubQueryRequests(
  accessToken: string,
  queryRequest: QueryRequest,
  jobId: number,
  ctx: ExecutionContext = createExecutionContext()
): Promise<{ sql: string; queryRequest: QueryRequest }[]> {
  if (!queryRequest.query?.iri) throw new Error("Query IRI is required to get indicator subqueries");
  const subqueries = await memo(ctx.subQueries, `indicator|${queryRequest.query.iri}`, () =>
    ctx.limit(() => QueryService.getSubqueryIris(accessToken, queryRequest.query!.iri!, true))
  );
  // Independent of one another, so fetched together; Promise.all keeps the original order
  return Promise.all(
    subqueries.map(async subquery => {
      const subqueryRequest = await ctx.limit(() =>
        QueryService.getQueryRequestForSQL(accessToken, {
          query: {
            iri: subquery.iri,
            queryType: IMQType.COHORT
          },
          argument: queryRequest.argument
        } as QueryRequest)
      );
      const sql = await ctx.limit(() => getValidatedSQL(subqueryRequest, accessToken, jobId));
      return { sql, queryRequest: subqueryRequest };
    })
  );
}
