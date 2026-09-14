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

export async function executeQuery(sessionId: string, sql: string, queryRequest: QueryRequest, queryResultSet: QueryResultSet) {
  if (!queryRequest.query?.iri) throw new Error("Query IRI is required for execution");
  const hashCodeVersion = hashQueryRequest(queryRequest);
  const existingQueryResultId = await getQueryResultIdIfExists(queryResultSet.id!, hashCodeVersion, queryRequest.query.iri);
  if (existingQueryResultId !== -1) return;

  const queryResultId = await createQueryResultEntry(queryRequest, queryResultSet, hashCodeVersion);

  const debugPatientId = getDebugPatientId(queryRequest);

  const queryIrisToQueryResultIds = {} as { [key: string]: number };
  if (!debugPatientId) queryIrisToQueryResultIds[queryRequest.query.iri] = queryResultId;

  await runSubQueries(sessionId, queryRequest, queryIrisToQueryResultIds, queryResultSet);

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
    console.error("Error executing debug query:", queryIri, err);
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
    console.error("Error executing query:", queryRequest.query?.iri, err);
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

  console.log("Dataset parts to run:", sqlParts.length);

  let lastResolvedSql: ResolvedSql | undefined;

  try {
    for (const sqlPart of sqlParts) {
      lastResolvedSql = getResolvedSql(sqlPart, queryRequest, queryIrisToQueryResultIds);
      await mysqlDb.execute(lastResolvedSql.query);
    }

    await updateWithEndTime(queryResultId, queryResultTable);
  } catch (err) {
    console.error("Error executing SQL part:", lastResolvedSql?.displaySql, err);
    throw err;
  } finally {
    await updateWithSQL(queryResultId, queryResultTable, lastResolvedSql?.displaySql ?? querySql);
  }
}

export function hashQueryRequest(queryRequest: QueryRequest): number {
  let argHash = "";
  const sortedArguments = [...queryRequest.argument!].sort((a, b) => (a.parameter ?? "").localeCompare(b.parameter ?? ""));
  for (const arg of sortedArguments) {
    argHash += hashArgument(arg);
  }
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
    .select()
    .from(queryResultTable)
    .where(and(eq(queryResultTable.queryResultSetId, resultSetId), eq(queryResultTable.version, hashCodeVersion), eq(queryResultTable.queryIri, iri)));
  const result = results[0];
  console.log(`Cache context check (${!!result}): ${resultSetId} with hash: ${hashCodeVersion}, iri: ${iri}.`);
  return result ? result.id! : -1;
}

export async function getQueryResultIdIfExistsInJob(jobId: number, hashCodeVersion: number, iri: string): Promise<number> {
  const results = await mysqlDb
    .select({ id: queryResultTable.id })
    .from(queryResultTable)
    .innerJoin(queryResultSetTable, eq(queryResultTable.queryResultSetId, queryResultSetTable.id))
    .where(and(eq(queryResultSetTable.jobId, jobId), eq(queryResultTable.version, hashCodeVersion), eq(queryResultTable.queryIri, iri)));
  const result = results[0];
  console.log(`Job cache context check (${!!result}): job ${jobId} with hash: ${hashCodeVersion}, iri: ${iri}.`);
  return result ? result.id! : -1;
}

export async function isCached(hashCode: number, iri: string): Promise<boolean> {
  return false;
  // const jobResult = await mysqlDb.query.jobTable.findFirst({
  //   where: (jobTable, { eq, and }) =>
  //     and(eq(jobTable.scheduleId, hashCode), eq(jobTable.status, "COMPLETED")),
  // });
  // if (jobResult) {
  //   console.log(`Cache hit for hashCode: ${hashCode}, and iri: ${iri}`);
  //   return true;
  // } else {
  //   const cohortResult = await mysqlDb.query.cohortTable.findFirst({
  //     where: (cohortTable, { eq }) => eq(cohortTable.hash, hashCode),
  //   });
  //   if (cohortResult) {
  //     console.log(
  //       `Cache hit in cohort for hashCode: ${hashCode}, and iri: ${iri}`,
  //     );
  //     return true;
  //   } else {
  //     const datasetResult = await mysqlDb.query.datasetTable.findFirst({
  //       where: (datasetTable, { eq }) => eq(datasetTable.hash, hashCode),
  //     });
  //     if (datasetResult) {
  //       console.log(
  //         `Cache hit in dataset for hashCode: ${hashCode}, and iri: ${iri}`,
  //       );
  //       return true;
  //     }
  //     return false;
  //   }
  // }
}

async function runSubQueries(sessionId: string, queryRequest: QueryRequest, queryIrisToHashCodes: { [key: string]: number }, queryResultSet: QueryResultSet) {
  const subQueries = await QueryService.getSubqueryIris(sessionId, queryRequest.query!.iri!);
  console.log("Subqueries to run:", subQueries.length);
  if (subQueries.length)
    for (const subQuery of subQueries) {
      try {
        const subQueryRequest = await QueryService.getQueryRequestForSQL(sessionId, {
          query: { iri: subQuery.iri },
          argument: queryRequest.argument
        } as QueryRequest);
        const hashCodeVersion = hashQueryRequest(subQueryRequest);

        const existingQueryResultId = await getQueryResultIdIfExistsInJob(queryResultSet.jobId, hashCodeVersion, subQueryRequest.query!.iri!);
        if (existingQueryResultId !== -1) {
          queryIrisToHashCodes[subQuery.iri!] = existingQueryResultId;
          continue;
        }

        queryIrisToHashCodes[subQuery.iri!] = await createQueryResultEntry(subQueryRequest, queryResultSet, hashCodeVersion);
        const subQuerySql = await QueryService.getQuerySql(sessionId, subQueryRequest);
        const resolvedSql = getResolvedSql(subQuerySql, subQueryRequest, queryIrisToHashCodes);
        await executeCohortQuery(resolvedSql, subQueryRequest, queryIrisToHashCodes[subQuery.iri!]!);
      } catch (err: any) {
        console.error("Error running subquery sql:", subQuery.iri, "\nError:", err.message);
        throw err;
      }
    }
}

export async function sortQueryRequestsByDependency(sessionId: string, queryRequests: QueryRequest[]): Promise<QueryRequest[]> {
  const iriToIndex = new Map<string, number>();
  queryRequests.forEach((queryRequest, index) => {
    if (queryRequest.query?.iri) iriToIndex.set(queryRequest.query.iri, index);
  });

  const dependencyIndexes: number[][] = await Promise.all(
    queryRequests.map(async queryRequest => {
      if (!queryRequest.query?.iri) return [];
      const subQueries = await QueryService.getSubqueryIris(sessionId, queryRequest.query.iri);
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
  const displayParts: string[] = [];
  let lastIndex = 0;

  for (const match of querySql.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const literal = querySql.slice(lastIndex, index);
      parts.push(sql.raw(literal));
      displayParts.push(literal);
    }

    const replacement = replacements.get(match[0]);

    if (!replacement) throw new Error(`No replacement found for SQL token "${match[0]}"`);

    parts.push(replacement);
    displayParts.push("?");

    lastIndex = index + match[0].length;
  }

  if (lastIndex < querySql.length) {
    const remaining = querySql.slice(lastIndex);
    parts.push(sql.raw(remaining));
    displayParts.push(remaining);
  }

  return { query: sql.join(parts, sql.raw("")), displaySql: displayParts.join("") };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getValidatedSQL(queryRequest: QueryRequest, sessionId: string, jobId: number): Promise<string> {
  const debugPatientId = getDebugPatientId(queryRequest);
  const sql = debugPatientId
    ? await QueryService.getQuerySqlDebug(sessionId, queryRequest.query!.iri!, debugPatientId)
    : await QueryService.getQuerySql(sessionId, queryRequest);
  if (!sql) {
    throw new Error("Could not generate SQL for query: " + queryRequest?.query?.iri + ", for job: " + jobId);
  }
  return sql;
}

export async function getIndicatorSubQueryRequests(
  session: string,
  queryRequest: QueryRequest,
  jobId: number
): Promise<{ sql: string; queryRequest: QueryRequest }[]> {
  if (!queryRequest.query?.iri) throw new Error("Query IRI is required to get indicator subqueries");
  const queriesToRun = [];
  const subqueries = await QueryService.getSubqueryIris(session, queryRequest.query.iri!, true);
  for (const subquery of subqueries) {
    const subqueryRequest = await QueryService.getQueryRequestForSQL(session, {
      query: {
        iri: subquery.iri,
        queryType: IMQType.COHORT
      },
      argument: queryRequest.argument
    } as QueryRequest);
    const subquerySql = await getValidatedSQL(subqueryRequest, session, jobId);
    queriesToRun.push({
      sql: subquerySql,
      queryRequest: subqueryRequest
    });
  }
  return queriesToRun;
}
