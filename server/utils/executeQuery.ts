import hash from "object-hash";
import { type Argument, type QueryRequest } from "~~/models/AutoGen";
import { mysqlDb } from "../db/mysql";
import { postgresDb } from "../db/postgres";
import { queueItem } from "~~/server/db/postgres/schema";
import { QueueItemStatus } from "~~/enums";
import { eq } from "drizzle-orm";
import { imapi } from "~~/server/utils/imapi";
import { cloneDeep } from "lodash-es";
import { type MySqlQueryResult } from "drizzle-orm/mysql2";
import Logger from "~~/shared/logger";
const LOG = Logger("api/queue/user");

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
  if (queryRequest.query.iri === undefined) return new Map();
  const subQueries = await imapi.getSubQueries(queryRequest.query.iri);
  const subQueryIris = subQueries.map((sq) => sq.iri);
  const queryIrisToHashCodes = await getQueryIrisToHashCodes(
    subQueryIris,
    queryRequest.argument
  );
  if (subQueries.length)
    for (const subQuery of subQueries) {
      const hashCode = queryIrisToHashCodes.get(subQuery.iri)!;
      LOG.debug(`Subquery found: ${subQuery.iri} with hash: ${hashCode}`);
      if (!queryResultsMap.has(hashCode) && !(await tableExists(hashCode))) {
        LOG.debug(`Executing subquery: ${subQuery.iri} with hash: ${hashCode}`);
        const subQueryRequest = await imapi.getQueryRequestForSQL({
          query: { iri: subQuery.iri },
          argument: queryRequest.argument,
        } as QueryRequest);
        const resolvedSql = await getResolvedSql(
          subQueryRequest,
          queryIrisToHashCodes
        );
        const [result] = (await mysqlDb.execute<PatientRow>(
          resolvedSql
        )) as unknown as QueryResult<PatientRow>;
        storeQueryResultsAndCache(
          queryRequest,
          result.map((r) => r.id)
        );
      } else {
        LOG.debug(
          `Query results already exist for subquery: ${subQuery.iri} with hash: ${hashCode}`
        );
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
  argument?: Argument[]
) {
  const queryIrisToHashCodes = new Map<string, string>();
  for (const subQueryIri of subQueries) {
    const subQueryRequest = await imapi.getQueryRequestForSQL({
      query: { iri: subQueryIri },
      argument: argument,
    } as QueryRequest);
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
