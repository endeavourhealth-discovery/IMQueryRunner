import { mysqlDb } from "~~/server/db/mysql";
import { cohortResultsTable, datasetResultsTable, indicatorResultTable, queryResultSetTable, queryResultTable } from "~~/server/db/mysql/schema";

import { IMQType } from "@endeavour/vue-library";

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

  const queryResultSetRows = await mysqlDb
    .select()
    .from(queryResultSetTable)
    .where(and(eq(queryResultSetTable.jobId, Number(jobId)), eq(queryResultSetTable.queryIri, decodedQueryIri)));
  const queryResultSet = queryResultSetRows[0];
  if (!queryResultSet) {
    throw createError("Query result set not found");
  }

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
      throw createError("Query SQL not found");
    }

    returnObject.executedSQL = executedSql;
  }

  return returnObject;
});
