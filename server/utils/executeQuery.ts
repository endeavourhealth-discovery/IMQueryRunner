import murmurhash from "murmurhash";
import { type ResultSetHeader } from "mysql2";
import { type Argument, type QueryRequest } from "~~/models/AutoGen";
import { mysqlDb } from "../db/mysql";
import { imapi } from "~~/server/utils/imapi";
import { type SubQueryDependency } from "~~/models/SubQueryDependency";

export async function executeQuery(sql: string, queryRequest: QueryRequest) {
  const queryRequestForSQL = await imapi.getQueryRequestForSQL(queryRequest);
  if (!queryRequestForSQL.query.iri)
    throw new Error("Query IRI is required for execution");
  const queryIrisToHashCodes = {} as { [key: string]: number };
  queryIrisToHashCodes["$hash"] = hashQueryRequest(queryRequestForSQL);
  console.log("Hash code for query:", queryIrisToHashCodes["$hash"]);
  // TODO: check if hashcode exists in db and is relevant, if so return cached results
  const subQueries = await imapi.getSubqueryIris(queryRequestForSQL.query.iri!);
  console.log("Subqueries to run:", subQueries.length);
  if (subQueries.length)
    try {
      await runSubQueries(subQueries, queryRequestForSQL, queryIrisToHashCodes);
    } catch (err) {
      console.error("Error running subqueries");
      throw err;
    }
  const resolvedSql = await getResolvedSql(
    sql,
    queryRequestForSQL,
    queryIrisToHashCodes,
  );
  if (queryRequestForSQL.query.queryType === "DATASET") {
    const sqlParts = resolvedSql.split(
      "----------------------------------------",
    );
    for (const sqlPart of sqlParts) {
      try {
        const [result] = await mysqlDb.execute<ResultSetHeader>(sqlPart);
        console.log("Executed SQL part, insertId:", result.insertId);
      } catch (err) {
        console.error("Error executing SQL part:", sqlPart);
        throw err;
      }
    }
    return {
      hashCode: queryIrisToHashCodes["$hash"],
    };
  } else {
    try {
      const [result] = await mysqlDb.execute<ResultSetHeader>(resolvedSql);
      return {
        insertId: result.insertId,
        hashCode: queryIrisToHashCodes["$hash"],
      };
    } catch (err) {
      console.error("Error executing SQL:", err);
      throw err;
    }
  }
}

export function hashQueryRequest(queryRequest: QueryRequest) {
  resolveArgs(queryRequest);
  let argHash = "";
  for (const arg of queryRequest.argument!) {
    argHash += hashArgument(arg);
  }
  if (queryRequest.query.iri) argHash += queryRequest.query.iri;
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

export async function getCachedQueryResults(
  queryRequest: QueryRequest,
): Promise<string[] | undefined> {
  const queryHash = hashQueryRequest(queryRequest);
  // TODO: call results/[queueId].get.ts to fetch results from dataset;
  return [];
  // return result.map((r) => r.id);
}

export async function isCachedAndRelevant(hashCode: number): Promise<boolean> {
  // check if query has been run
  // check if the results are still relevant (by date)
  return false;
}

async function runSubQueries(
  subQueries: SubQueryDependency[],
  queryRequest: QueryRequest,
  queryIrisToHashCodes: { [key: string]: number },
) {
  await getQueryIrisToHashCodes(
    subQueries,
    queryRequest.argument ?? [],
    queryIrisToHashCodes,
  );
  if (subQueries.length) {
    for (const subQueryIri of subQueries) {
      const subQueryRequest = await imapi.getQueryRequestForSQL({
        query: subQueryIri,
        argument: queryRequest.argument,
      } as QueryRequest);
      const hashCode = hashQueryRequest(subQueryRequest);
      const subQuerySql = await imapi.getQuerySql(subQueryRequest);
      if (!isCachedAndRelevant(hashCode)) {
        const resolvedSql = await getResolvedSql(
          subQuerySql,
          subQueryRequest,
          queryIrisToHashCodes,
        );
        // awaiting drizzle pr #1523 for typings to work correctly. This is a fix as described in drizzle issue #661
        await mysqlDb.execute(resolvedSql);
      }
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
      sql = sql.replaceAll(iri, JSON.stringify(queryIrisToHashCodes[iri]));
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

async function getQueryIrisToHashCodes(
  subQueries: SubQueryDependency[],
  argument: Argument[],
  queryIrisToHashCodes: { [key: string]: number },
) {
  for (const subQueryDep of subQueries) {
    const subQueryIri = subQueryDep.iri;
    const subQueryRequest = await imapi.getQueryRequestForSQL({
      query: subQueryIri,
      argument: argument,
    } as QueryRequest);
    const hashCode = hashQueryRequest(subQueryRequest);
    queryIrisToHashCodes[subQueryIri] = hashCode;
  }
  return queryIrisToHashCodes;
}
