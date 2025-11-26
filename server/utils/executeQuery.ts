import hash from "object-hash";
import {
  DisplayMode,
  type Argument,
  type Match,
  type Query,
  type QueryRequest,
} from "~~/models/AutoGen";
import { mysqlDb } from "../db/mysql/mysql";
import { postgresDb } from "../db/postgres/postgres";
import { queueItem } from "~~/server/db/postgres/schemas/query_runner/schema";
import { QueueItemStatus } from "~~/enums";
import { eq } from "drizzle-orm";
import { imapi } from "~~/server/utils/imapi";
import { cloneDeep } from "lodash-es";
import { type MySqlQueryResult } from "drizzle-orm/mysql2";

const queryResultsMap = new Map<string, Set<string>>();

interface QueryResult<TDataOut> extends MySqlQueryResult<TDataOut> {}

type PatientRow = {
  id: string;
};

export async function executeQuery(
  sql: string,
  queryRequest: QueryRequest,
  id: string
) {
  const cachedResults = await getCachedQueryResults(queryRequest);
  if (cachedResults) return cachedResults;
  const queryIrisToHashCodes = await runSubQueries(queryRequest);
  const resolvedSql = await getResolvedSql(queryRequest, queryIrisToHashCodes);
  const [result] = (await mysqlDb.execute<PatientRow>(
    resolvedSql
  )) as unknown as QueryResult<PatientRow>;
  storeQueryResultsAndCache(
    queryRequest,
    result.map((r) => r.id)
  );
  await postgresDb
    .update(queueItem)
    .set({
      status: QueueItemStatus.COMPLETED,
      finishedAt: new Date().toISOString(),
    })
    .where(eq(queueItem.id, id));
  return result.map((r) => r.id);
}

function hashQueryRequest(queryRequest: QueryRequest) {
  resolveArgs(queryRequest);
  let argHash = "";
  for (const arg of queryRequest.argument!) {
    argHash += hashArgument(arg);
  }
  if (queryRequest.query.iri) argHash += queryRequest.query.iri;
  return hash(argHash);
}

function resolveArgs(queryRequest: QueryRequest) {
  if (!queryRequest.argument) queryRequest.argument = [];
  const defaultDates = ["$searchDate", "$achievementDate"];
  for (const date of defaultDates) {
    const hasDate = queryRequest.argument.find((arg) => arg.parameter === date);
    if (!hasDate)
      queryRequest.argument.push({
        parameter: date,
        valueData: new Date().toString(),
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
  if (argument.valuePathList) {
    const sorted = argument.valuePathList.toSorted();
    for (const path of sorted) {
      hashString += path.iri;
    }
  }
  if (argument.valueObject) hashString += argument.valueObject;
  if (argument.valueVariable) hashString += argument.valueVariable;
  return hashString;
}

export async function getCachedQueryResults(
  queryRequest: QueryRequest
): Promise<string[] | undefined> {
  const queryHash = hashQueryRequest(queryRequest);
  const cachedResult = queryResultsMap.get(queryHash);
  if (cachedResult) return Array.from(cachedResult);
  if (!(await tableExists(queryHash))) return;
  let cacheSql = `
SELECT id
FROM imqcache.${queryHash}
`;
  if (
    queryRequest.page &&
    queryRequest.page.pageNumber &&
    queryRequest.page.pageNumber > 0 &&
    queryRequest.page.pageSize &&
    queryRequest.page.pageSize > 0
  )
    cacheSql += ` LIMIT ${queryRequest.page.pageSize} OFFSET ${
      (queryRequest.page.pageNumber - 1) * queryRequest.page.pageSize
    };`;
  else cacheSql += ";";
  const [result] = (await mysqlDb.execute<PatientRow>(
    cacheSql
  )) as unknown as QueryResult<PatientRow>;
  return result.map((r) => r.id);
}

async function tableExists(tableName: string) {
  const [result] = (await mysqlDb.execute<{ id: string }>(`
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'imqcache'
AND TABLE_NAME = '${tableName}'
;
`)) as unknown as QueryResult<{ id: string }>;
  if (!result || !result.length) return false;
  return true;
}

async function runSubQueries(queryRequest: QueryRequest) {
  const subQueries = await getSubqueryIris(queryRequest.query);
  const queryIrisToHashCodes = await getQueryIrisToHashCodes(
    subQueries,
    queryRequest.argument ? queryRequest.argument : []
  );
  if (subQueries?.length) {
    for (const subQueryIri of subQueries) {
      const subQuery = await imapi.describeQuery(
        subQueryIri,
        DisplayMode.LOGICAL
      );
      const subQueryRequest = {
        query: subQuery,
        argument: queryRequest.argument,
      } as QueryRequest;
      const hashCode = hashQueryRequest(subQueryRequest);
      if (!queryResultsMap.has(hashCode) && !(await tableExists(hashCode))) {
        const resolvedSql = await getResolvedSql(
          subQueryRequest,
          queryIrisToHashCodes
        );
        // awaiting drizzle pr #1523 for typings to work correctly. This is a fix as described in drizzle issue #661
        const [result] = (await mysqlDb.execute<PatientRow>(
          resolvedSql
        )) as unknown as QueryResult<PatientRow>;
        await storeQueryResultsAndCache(
          subQueryRequest,
          result.map((r) => r.id)
        );
      }
    }
  }
  return queryIrisToHashCodes;
}

async function getResolvedSql(
  queryRequest: QueryRequest,
  queryIrisToHashCodes: Map<string, string>
) {
  let sql = await imapi.getQuerySql(queryRequest);
  if (queryRequest.argument) {
    for (const arg of queryRequest.argument) {
      if (arg.valueData && arg.parameter)
        sql = sql.replace(arg.parameter, `'${arg.valueData}'`);
      else if (arg.valueIri && arg.parameter)
        sql = sql.replace(arg.parameter, `'${arg.valueIri.iri}'`);
      else if (arg.valueIriList && arg.parameter) {
        sql = sql.replace(
          arg.parameter,
          getIriLine(arg.valueIriList.map((v) => v.iri))
        );
      }
    }
  }
  if (queryIrisToHashCodes?.size > 0) {
    for (const iri of queryIrisToHashCodes.keys()) {
      sql = sql.replace(
        "q_" + iri,
        JSON.stringify(queryIrisToHashCodes.get(iri))
      );
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
  subQueries: string[],
  argument: Argument[]
) {
  const queryIrisToHashCodes = new Map<string, string>();
  for (const subQueryIri of subQueries) {
    const subQuery = await imapi.describeQuery(
      subQueryIri,
      DisplayMode.LOGICAL
    );
    const subQueryRequest = {
      query: subQuery,
      argument: argument,
    } as QueryRequest;
    const hashCode = hashQueryRequest(subQueryRequest);
    queryIrisToHashCodes.set(subQueryIri, hashCode);
  }
  return queryIrisToHashCodes;
}

async function storeQueryResultsAndCache(
  queryRequest: QueryRequest,
  results: string[]
) {
  const queryHash = hashQueryRequest(queryRequest);
  queryResultsMap.set(queryHash, new Set(results));
  await createTable(queryHash);
  if (results.length) {
    await mysqlDb.execute(
      `INSERT INTO ${queryHash} (id) VALUES (${results.join("), \n(") + ")"}`
    );
  }
}

async function createTable(hashCode: string) {
  await mysqlDb.execute(
    `CREATE TABLE IF NOT EXISTS ${hashCode} (id BIGINT NOT NULL,PRIMARY KEY(id))`
  );
}

async function getSubqueryIris(query: Query): Promise<string[]> {
  let subQueryIris: string[] = [];
  await populateSubqueryIrisConclusively(query, subQueryIris);
  subQueryIris = deduplicateKeepLast(subQueryIris);
  return subQueryIris;
}

function deduplicateKeepLast(subQueryIris: string[]): string[] {
  const seen = new Set<string>();
  const copySubqueryIris = cloneDeep(subQueryIris);
  while (copySubqueryIris.length) {
    const last = copySubqueryIris.pop();
    if (last) seen.add(last);
  }
  const result: string[] = Array.from<string>(seen);
  return result.reverse();
}

async function populateSubqueryIrisConclusively(
  query: Query,
  subQueryIris: string[]
): Promise<void> {
  if (query.isCohort) subQueryIris.push(query.isCohort.iri);
  if (query.and) {
    for (const and of query.and) {
      await processMatch(and, subQueryIris);
    }
  }
  if (query.or) {
    for (const or of query.or) {
      await processMatch(or, subQueryIris);
    }
  }
  if (query.not) {
    for (const not of query.not) {
      await processMatch(not, subQueryIris);
    }
  }
}

async function processMatch(
  match: Match,
  subQueryIris: string[]
): Promise<void> {
  if (match.isCohort) {
    const iri = match.isCohort.iri;
    subQueryIris.push(iri);
    const subQuery = await imapi.describeQuery(iri, DisplayMode.LOGICAL);
    if (!subQuery) throw createError(`Sub query with iri: ${iri} not found`);
    await populateSubqueryIrisConclusively(subQuery, subQueryIris);
  }
  if (match.and) {
    for (const nestedAnd of match.and) {
      await processMatch(nestedAnd, subQueryIris);
    }
  }
  if (match.or) {
    for (const nestedOr of match.or) {
      await processMatch(nestedOr, subQueryIris);
    }
  }
  if (match.not) {
    for (const nestedNot of match.not) {
      await processMatch(nestedNot, subQueryIris);
    }
  }
}
