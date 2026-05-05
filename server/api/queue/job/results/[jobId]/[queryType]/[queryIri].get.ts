import { mysqlDb } from "~~/server/db/mysql";
import { cohortResultsTable, datasetResultsTable } from "~~/server/db/mysql/schema";

import { IMQType } from "vue-library";

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

  const queryResultSet = await mysqlDb.query.queryResultSetTable.findFirst({
    where: q => and(eq(q.jobId, Number(jobId)), eq(q.queryIri, decodedQueryIri))
  });
  if (!queryResultSet) {
    throw createError("Query result set not found");
  }

  const limit = size;
  const offset = (page - 1) * size;
  const returnObject = {
    result: [] as any[],
    totalCount: 0,
    page: page
  };

  if (queryType === IMQType.INDICATOR) {
    const indicatorResult = await mysqlDb.query.indicatorResultTable.findFirst({
      where: q => and(eq(q.queryIri, decodedQueryIri), eq(q.queryResultSetId, queryResultSet.id))
    });
    // TODO: return indicator results - get sql from imapi
    return returnObject;
  } else {
    const queryResult = await mysqlDb.query.queryResultTable.findFirst({
      where: q => and(eq(q.queryIri, decodedQueryIri), eq(q.queryResultSetId, queryResultSet.id))
    });

    if (!queryResult) {
      throw createError("Query result not found");
    }

    if (queryType === IMQType.COHORT) {
      const whereClause = eq(cohortResultsTable.queryResultId, queryResult.id);
      const cohortResults = await mysqlDb.query.cohortResultsTable.findMany({
        where: whereClause,
        limit,
        offset
      });
      const totalResult = await mysqlDb.select({ count: count() }).from(cohortResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = cohortResults;
      returnObject.totalCount = totalCount;
    } else if (queryType === IMQType.DATASET) {
      const whereClause = eq(datasetResultsTable.queryResultId, queryResult.id);
      const datasetResults = await mysqlDb.query.datasetResultsTable.findMany({
        where: whereClause,
        limit,
        offset
      });
      const totalResult = await mysqlDb.select({ count: count() }).from(datasetResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = datasetResults;
      returnObject.totalCount = totalCount;
    }
  }

  return returnObject;
});
