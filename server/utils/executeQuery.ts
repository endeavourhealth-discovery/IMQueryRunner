import { JobStatus } from "~~/enums";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

import { IMQType } from "@endeavour/vue-library";
import { type Argument, type QueryRequest, type SubQueryDependency } from "@endeavour/vue-library/interfaces";

import { and, eq } from "drizzle-orm";
import murmurhash from "murmurhash";
import { type ResultSetHeader } from "mysql2";

import { mysqlDb } from "../db/mysql";
import { queryResultTable } from "../db/mysql/schema";
import { createQueryResultEntry, getToday, updateJobStatus, updateWithEndTime, updateWithSQL } from "../helpers/mysqlHelper";
import QueryService from "../services/QueryService";

export async function executeQuery(sessionId: string, sql: string, queryRequest: QueryRequest, queryResultSet: QueryResultSet) {
  if (!queryRequest.query.iri) throw new Error("Query IRI is required for execution");
  const queryIrisToQueryResultIds = {} as { [key: string]: number };
  const hashCodeVersion = hashQueryRequest(queryRequest);
  const existingQueryResultId = await getQueryResultIdIfExists(queryResultSet.id!, hashCodeVersion, queryRequest.query.iri);
  if (existingQueryResultId !== -1) return;

  const queryResultId = await createQueryResultEntry(queryRequest, queryResultSet, hashCodeVersion);
  queryIrisToQueryResultIds[queryRequest.query.iri] = queryResultId;

  await runSubQueries(sessionId, queryRequest, queryIrisToQueryResultIds, queryResultSet);

  const resolvedSql = await getResolvedSql(sql, queryRequest, queryIrisToQueryResultIds);
  switch (queryRequest.query.queryType) {
    case IMQType.DATASET:
      await executeDatasetQuery(resolvedSql, queryResultId);
      break;
    case IMQType.COHORT:
      await executeCohortQuery(resolvedSql, queryRequest, queryResultId);
      break;
    default:
      throw new Error("Unsupported query type: " + queryRequest.query.queryType);
  }
}

export async function executeCohortQuery(resolvedSql: string, queryRequest: QueryRequest, queryResultId: number) {
  // DEBUG: console.log("Executing cohort query:", resolvedSql);
  try {
    await mysqlDb.execute<ResultSetHeader>(resolvedSql);
    await updateWithEndTime(queryResultId, queryResultTable);
  } catch (err: any) {
    if (err instanceof Error && err.cause instanceof Error) {
      if (err.cause.message && err.cause.message === "Query execution was interrupted") throw err;
    } else {
      console.error("Error executing query:", queryRequest.query.iri);
      throw err;
    }
  }
  await updateWithSQL(queryResultId, queryResultTable, resolvedSql);
}

export async function executeDatasetQuery(resolvedSql: string, queryResultId: number) {
  const sqlParts = resolvedSql.split("----------------------------------------");
  console.log("Dataset parts to run:", sqlParts.length);
  for (const sqlPart of sqlParts) {
    try {
      await mysqlDb.execute<ResultSetHeader>(sqlPart);
    } catch (err: any) {
      if (err instanceof Error && err.cause instanceof Error) {
        if (err.cause.message && err.cause.message === "Query execution was interrupted") throw err;
      } else {
        console.error("Error executing SQL part:", err.cause || err.message || err);
        throw err;
      }
    }
  }
  await updateWithSQL(queryResultId, queryResultTable, resolvedSql);
  await updateWithEndTime(queryResultId, queryResultTable);
}

export function hashQueryRequest(queryRequest: QueryRequest): number {
  let argHash = "";
  for (const arg of queryRequest.argument!) {
    argHash += hashArgument(arg);
  }
  if (queryRequest.query.iri) argHash += queryRequest.query.iri;
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
    .where(and(eq(queryResultTable.id, resultSetId), eq(queryResultTable.version, hashCodeVersion), eq(queryResultTable.queryIri, iri)));
  const result = results[0];
  console.log(`Cache context check (${!!result}): ${resultSetId} with hash: ${hashCodeVersion}, iri: ${iri}.`);
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
  const subQueries = await QueryService.getSubqueryIris(sessionId, queryRequest.query.iri!);
  console.log("Subqueries to run:", subQueries.length);
  if (subQueries.length)
    for (const subQuery of subQueries) {
      try {
        const subQueryRequest = await QueryService.getQueryRequestForSQL(sessionId, {
          query: { iri: subQuery.iri },
          argument: queryRequest.argument
        } as QueryRequest);
        const hashCodeVersion = hashQueryRequest(subQueryRequest);

        const existingQueryResultId = await getQueryResultIdIfExists(queryResultSet.id!, hashCodeVersion, subQueryRequest.query.iri!);
        if (existingQueryResultId !== -1) {
          queryIrisToHashCodes[subQuery.iri!] = existingQueryResultId;
          continue;
        }

        queryIrisToHashCodes[subQuery.iri!] = await createQueryResultEntry(subQueryRequest, queryResultSet, hashCodeVersion);
        const subQuerySql = await QueryService.getQuerySql(sessionId, subQueryRequest);
        const resolvedSql = await getResolvedSql(subQuerySql, subQueryRequest, queryIrisToHashCodes);
        await executeCohortQuery(resolvedSql, subQueryRequest, queryIrisToHashCodes[subQuery.iri!]!);
      } catch (err: any) {
        console.error("Error running subquery sql:", subQuery.iri, "\nError:", err.message);
        throw err;
      }
    }
}

async function getResolvedSql(sql: string, queryRequest: QueryRequest, queryIrisToHashCodes: { [key: string]: number }) {
  if (queryRequest.argument) {
    for (const arg of queryRequest.argument) {
      if (arg.valueData && arg.parameter) sql = sql.replaceAll(arg.parameter, `'${arg.valueData}'`);
      else if (arg.valueIri && arg.parameter) sql = sql.replaceAll(arg.parameter, `'${arg.valueIri.iri}'`);
      else if (arg.valueIriList && arg.parameter) sql = sql.replaceAll(arg.parameter, getIriLine(arg.valueIriList.map(v => v.iri)));
      else if (arg.valueDataList && arg.parameter) sql = sql.replaceAll(arg.parameter, `(${arg.valueDataList.map(v => `'${v}'`).join(", ")})`);
    }
  }
  if (Object.keys(queryIrisToHashCodes).length > 0) {
    for (const iri of Object.keys(queryIrisToHashCodes)) {
      sql = sql.replaceAll(iri, "" + queryIrisToHashCodes[iri]);
    }
  }
  return sql;
}

function getIriLine(stringIris: string[]): string {
  for (const stringIri of stringIris) {
    if (stringIri.indexOf(":") === -1) throw createError("Invalid iri");
  }
  return stringIris.join(" ");
}

export async function getValidatedSQL(queryRequest: QueryRequest, sessionId: string, jobId: number): Promise<string> {
  let sql: string | undefined = await QueryService.getQuerySql(sessionId, queryRequest).catch(async (err: Error) => {
    await updateJobStatus(jobId, JobStatus.ERRORED, err);
    return undefined;
  });
  if (!sql) {
    throw new Error("Could generate SQL for query: " + queryRequest?.query?.iri + ", for job: " + jobId);
  }
  return sql;
}

export async function getIndicatorSubQueryRequests(
  session: string,
  queryRequest: QueryRequest,
  jobId: number
): Promise<{ sql: string; queryRequest: QueryRequest }[]> {
  if (!queryRequest.query.iri) throw new Error("Query IRI is required to get indicator subqueries");
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
