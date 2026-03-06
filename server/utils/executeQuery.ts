import murmurhash from "murmurhash";
import { type ResultSetHeader } from "mysql2";
import { type Argument, type QueryRequest } from "vue-library/interfaces";
import { mysqlDb } from "../db/mysql";
import { imapi } from "~~/server/utils/imapi";
import { type SubQueryDependency } from "~~/models/SubQueryDependency";

export async function executeQuery(
  sessionId: string,
  sql: string,
  queryRequest: QueryRequest,
) {
  const queryRequestForSQL = await imapi.getQueryRequestForSQL(
    sessionId,
    queryRequest,
  );
  if (!queryRequestForSQL.query.iri)
    throw new Error("Query IRI is required for execution");
  const hashCode = hashQueryRequest(queryRequestForSQL);

  if (await isCached(hashCode)) {
    console.log(
      `Subquery cache hit for hashCode: ${hashCode} and iri: ${queryRequestForSQL.query.iri}`,
    );
    return { hashCode: hashCode };
  }

  const queryIrisToHashCodes = {} as { [key: string]: number };
  queryIrisToHashCodes[queryRequestForSQL.query.iri] = hashCode;
  console.log("Hash code for query:", hashCode);
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
      queryIrisToHashCodes,
    );
  const resolvedSql = await getResolvedSql(
    sql,
    queryRequestForSQL,
    queryIrisToHashCodes,
  );
  if (queryRequestForSQL.query.queryType === "DATASET") {
    const sqlParts = resolvedSql.split(
      "----------------------------------------",
    );
    console.log("Dataset parts to run:", sqlParts.length);
    for (const sqlPart of sqlParts) {
      try {
        const [result] = await mysqlDb.execute<ResultSetHeader>(sqlPart);
        console.log(
          `Executed dataset with insertId: ${result.insertId} and hashCode: ${hashCode}`,
        );
      } catch (err) {
        console.error("Error executing SQL part:", sqlPart);
        throw err;
      }
    }
    return {
      hashCode: hashCode,
    };
  } else {
    try {
      const [result] = await mysqlDb.execute<ResultSetHeader>(resolvedSql);
      return {
        insertId: result.insertId,
        hashCode: hashCode,
      };
    } catch (err) {
      console.error("Error executing query:", queryRequestForSQL.query.iri);
      console.error("Error executing SQL:", err);
      throw err;
    }
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

export async function isCached(hashCode: number): Promise<boolean> {
  try {
    const sql = `SELECT 1 FROM compass.\`${hashCode}\` LIMIT 1`;
    await mysqlDb.execute<ResultSetHeader>(sql);
    return true;
  } catch (error) {
    return false;
  }
}

async function runSubQueries(
  sessionId: string,
  subQueries: SubQueryDependency[],
  queryRequest: QueryRequest,
  queryIrisToHashCodes: { [key: string]: number },
) {
  for (const subQuery of subQueries) {
    try {
      const subQueryRequest = await imapi.getQueryRequestForSQL(sessionId, {
        query: { iri: subQuery.iri },
        argument: queryRequest.argument,
      } as QueryRequest);
      const hashCode = hashQueryRequest(subQueryRequest);
      queryIrisToHashCodes[subQuery.iri] = hashCode;
      const subQuerySql = await imapi.getQuerySql(sessionId, subQueryRequest);
      if (await isCached(hashCode)) {
        console.log(
          `Subquery cache hit for hashCode: ${hashCode} and iri: ${subQuery.iri}`,
        );
        continue;
      }
      const resolvedSql = await getResolvedSql(
        subQuerySql,
        subQueryRequest,
        queryIrisToHashCodes,
      );
      const [result] = await mysqlDb.execute<ResultSetHeader>(resolvedSql);
      console.log(
        `Subquery executed with insertId: ${result.insertId} and hashCode: ${hashCode}`,
      );
    } catch (err: any) {
      console.error("Error running subquery sql:", err.message);
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
