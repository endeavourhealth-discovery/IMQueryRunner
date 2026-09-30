import { ErrorCode } from "~~/enums";
import { mysqlDb } from "~~/server/db/mysql";
import { cohortResultsTable, datasetResultsTable, indicatorResultTable, jobTable, queryResultSetTable, queryResultTable } from "~~/server/db/mysql/schema";

import { isArrayHasLength } from "@endeavour/vue-library";
import { IMQType } from "@endeavour/vue-library/enums";

import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

const paramSchema = z.object({
  jobId: z.string(),
  queryType: z.string(),
  queryIri: z.string()
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25)
});

export default defineEventHandler(async event => {
  const { jobId, queryIri, queryType } = await getValidatedRouterParams(event, paramSchema.parse);
  const { page, size } = await getValidatedQuery(event, querySchema.parse);
  const decodedQueryIri = decodeURIComponent(queryIri);
  // TODO: Refactor to use a single query with joins instead of multiple queries

  const jobRows = await mysqlDb
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  if (!isArrayHasLength(jobRows)) throw createError({ status: 400, statusText: ErrorCode.MissingDataError, message: "Queue job not found" });

  const queryResultSetRows = await mysqlDb
    .select()
    .from(queryResultSetTable)
    .where(eq(queryResultSetTable.jobId, Number(jobId)));
  if (!isArrayHasLength(queryResultSetRows)) {
    throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query result set not found" });
  }
  const queryResultSet = queryResultSetRows[0];

  const returnObject = {
    executedSQL: ""
  };

  if (queryType === IMQType.INDICATOR) {
    // TODO: return indicator sql from imapi?
    return returnObject;
  } else {
    const queryResultRows = await mysqlDb
      .select({ executedSql: queryResultTable.executedSQL })
      .from(queryResultTable)
      .where(and(eq(queryResultTable.queryIri, decodedQueryIri), eq(queryResultTable.queryResultSetId, queryResultSet.id)));

    const executedSql = queryResultRows[0]?.executedSql ?? null;

    if (!executedSql) {
      throw createError({ statusCode: 404, statusText: ErrorCode.MissingDataError, message: "Query SQL not found" });
    }

    returnObject.executedSQL = executedSql;
  }

  return returnObject;
});
