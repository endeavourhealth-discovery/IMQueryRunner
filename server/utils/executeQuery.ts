import murmurhash from "murmurhash";
import { type ResultSetHeader } from "mysql2";
import {
  IM,
  IMQType,
  type Argument,
  type QueryRequest,
} from "~~/models/AutoGen";
import { mysqlDb } from "../db/mysql";
import { imapi } from "~~/server/utils/imapi";
import { type SubQueryDependency } from "~~/models/SubQueryDependency";
import { queryResultTable } from "../db/mysql/schema";
import { type QueryResult } from "~~/models/queryResult.schema";
import { type QueryResultSet } from "~~/models/queryResultSet.schema";

export async function executeQuery(
  sessionId: string,
  sql: string,
  queryRequest: QueryRequest,
  queryResultSet: QueryResultSet,
) {
  const queryRequestForSQL = await imapi.getQueryRequestForSQL(
    sessionId,
    queryRequest,
  );
  if (!queryRequestForSQL.query.iri)
    throw new Error("Query IRI is required for execution");
  const hashCodeVersion = hashQueryRequest(queryRequestForSQL);
  // const queryResult = {} as QueryResult; // TODO: check if indicator
  const queryIrisToQueryResultIds = {} as { [key: string]: number };
  const queryResultId = await saveResult(
    queryRequestForSQL,
    queryResultSet,
    hashCodeVersion,
  );
  queryIrisToQueryResultIds[queryRequestForSQL.query.iri] = queryResultId;
  const subQueries = await imapi.getSubqueryIris(
    sessionId,
    queryRequestForSQL.query.iri,
  );
  console.log("Subqueries to run:", subQueries.length);
  if (subQueries.length)
    await runSubQueries(
      sessionId,
      subQueries,
      queryRequestForSQL,
      queryIrisToQueryResultIds,
      queryResultSet,
    );
  const resolvedSql = await getResolvedSql(
    sql,
    queryRequestForSQL,
    queryIrisToQueryResultIds,
  );
  if (queryRequestForSQL.query.queryType === "DATASET") {
    const sqlParts = resolvedSql.split(
      "----------------------------------------",
    );
    console.log("Dataset parts to run:", sqlParts.length);
    for (const sqlPart of sqlParts) {
      try {
        const [result] = await mysqlDb.execute<ResultSetHeader>(sqlPart);
        console.log(`Executed dataset with id: ${queryResultId}`);
      } catch (err: any) {
        console.error(
          "Error executing SQL part:",
          err.cause || err.message || err,
        );
        throw err;
      }
    }
    return {
      id: queryResultId,
    };
  } else {
    try {
      const [result] = await mysqlDb.execute<ResultSetHeader>(resolvedSql);
      return {
        id: queryResultId,
      };
    } catch (err) {
      console.error("Error executing query:", queryRequestForSQL.query.iri);
      console.error("Error executing SQL:", err);
      throw err;
    }
  }
}

export async function saveResult(
  queryRequestForSQL: QueryRequest,
  queryResultSet: QueryResultSet,
  hashCodeVersion: number,
) {
  switch (queryRequestForSQL.query.queryType) {
    case IMQType.COHORT:
    case IMQType.DATASET:
      const queryResult = {
        startOfDaySnapshot: queryResultSet.startOfDaySnapshot,
        persistent: queryResultSet.persistent,
        useStartOfDaySnapshot: queryResultSet.useStartOfDaySnapshot,
        startTime: new Date().toISOString().slice(0, 19).replace("T", " "),
        queryIri: queryRequestForSQL.query.iri,
        searchDate: queryResultSet.searchDate
          ? new Date(queryResultSet.searchDate)
          : null,
        achievementDate: queryResultSet.achievementDate
          ? new Date(queryResultSet.achievementDate)
          : null,
        indicator: 0, // TODO: set correct indicator
        queryResultSetId: queryResultSet.id,
        version: hashCodeVersion,
      } as QueryResult;
      const result = await mysqlDb.insert(queryResultTable).values(queryResult);
      return result?.[0]?.insertId;

    case IMQType.INDICATOR:
      console.log("Indicator execution is not implemented yet");
      return 0;

    default:
      throw new Error(
        "Unsupported query type: " + queryRequestForSQL.query.queryType,
      );
  }
}

export function hashQueryRequest(queryRequest: QueryRequest): number {
  resolveArgs(queryRequest);
  let argHash = "";
  for (const arg of queryRequest.argument!) {
    argHash += hashArgument(arg);
  }
  if (queryRequest.query.iri) argHash += queryRequest.query.iri;
  return murmurhash.v3(argHash);
}

export function hashQueryRequests(queryRequests: QueryRequest[]): number {
  let argHash = "";
  for (const queryRequest of queryRequests) {
    resolveArgs(queryRequest);
    for (const arg of queryRequest.argument!) {
      argHash += hashArgument(arg);
    }
    if (queryRequest.query.iri) argHash += queryRequest.query.iri;
  }
  return murmurhash.v3(argHash);
}

function resolveArgs(queryRequest: QueryRequest) {
  if (!queryRequest.argument) queryRequest.argument = [];
  const defaultDates = ["$searchDate", "$achievementDate"];
  for (const date of defaultDates) {
    const hasDate = queryRequest.argument.find((arg) => arg.parameter === date);
    if (!hasDate)
      queryRequest.argument.push({
        parameter: date,
        valueData: new Date().toISOString().split("T")[0],
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

export async function isCached(
  hashCode: number,
  iri: string,
): Promise<boolean> {
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

async function runSubQueries(
  sessionId: string,
  subQueries: SubQueryDependency[],
  queryRequest: QueryRequest,
  queryIrisToHashCodes: { [key: string]: number },
  queryResultSet: QueryResultSet,
) {
  for (const subQuery of subQueries) {
    try {
      const subQueryRequest = await imapi.getQueryRequestForSQL(sessionId, {
        query: { iri: subQuery.iri },
        argument: queryRequest.argument,
      } as QueryRequest);
      const hashCodeVersion = hashQueryRequest(subQueryRequest);
      queryIrisToHashCodes[subQuery.iri] = await saveResult(
        subQueryRequest,
        queryResultSet,
        hashCodeVersion,
      );

      const subQuerySql = await imapi.getQuerySql(sessionId, subQueryRequest);

      const resolvedSql = await getResolvedSql(
        subQuerySql,
        subQueryRequest,
        queryIrisToHashCodes,
      );
      const [result] = await mysqlDb.execute<ResultSetHeader>(resolvedSql);
      console.log(`Subquery executed with id: ${result.insertId}`);
    } catch (err: any) {
      console.error(
        "Error running subquery sql:",
        subQuery.iri,
        "\nError:",
        err.message,
      );
      throw err;
    }
  }
  return queryIrisToHashCodes;
}

async function getResolvedSql(
  sql: string,
  queryRequest: QueryRequest,
  queryIrisToHashCodes: { [key: string]: number },
) {
  if (queryRequest.argument) {
    for (const arg of queryRequest.argument) {
      if (arg.valueData && arg.parameter)
        sql = sql.replaceAll(arg.parameter, `'${arg.valueData}'`);
      else if (arg.valueIri && arg.parameter)
        sql = sql.replaceAll(arg.parameter, `'${arg.valueIri.iri}'`);
      else if (arg.valueIriList && arg.parameter) {
        sql = sql.replaceAll(
          arg.parameter,
          getIriLine(arg.valueIriList.map((v) => v.iri)),
        );
      }
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
