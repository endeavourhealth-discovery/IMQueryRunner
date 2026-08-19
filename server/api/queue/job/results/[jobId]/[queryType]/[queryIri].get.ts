import { mysqlDb } from "~~/server/db/mysql";
import {
  cohortResultsTable,
  datasetResultsTable,
  indicatorResultTable,
  jobTable,
  patientExistsTable,
  queryResultSetTable,
  queryResultTable
} from "~~/server/db/mysql/schema";
import { getDebugPatientId } from "~~/server/utils/executeQuery";

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

  const queryResultSetRows = await mysqlDb
    .select()
    .from(queryResultSetTable)
    .where(and(eq(queryResultSetTable.jobId, Number(jobId)), eq(queryResultSetTable.queryIri, decodedQueryIri)));
  const queryResultSet = queryResultSetRows[0];
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

  const jobRows = await mysqlDb.select().from(jobTable).where(eq(jobTable.id, queryResultSet.jobId));
  const job = jobRows[0];
  const debugPatientId = job?.queryRequests?.map(getDebugPatientId).find(Boolean);

  if (debugPatientId) {
    const whereClause = and(eq(patientExistsTable.queryIri, decodedQueryIri), eq(patientExistsTable.patientId, debugPatientId));
    const debugResults = await mysqlDb.select().from(patientExistsTable).where(whereClause).limit(limit).offset(offset);
    const totalResult = await mysqlDb.select({ count: count() }).from(patientExistsTable).where(whereClause);
    returnObject.result = debugResults;
    returnObject.totalCount = totalResult[0]?.count ?? 0;
    return returnObject;
  }

  if (queryType === IMQType.INDICATOR) {
    const indicatorResultRows = await mysqlDb
      .select()
      .from(indicatorResultTable)
      .where(and(eq(indicatorResultTable.queryIri, decodedQueryIri), eq(indicatorResultTable.queryResultSetId, queryResultSet.id)));
    const indicatorResult = indicatorResultRows[0];
    // TODO: return indicator results - get sql from imapi
    return returnObject;
  } else {
    const queryResultRows = await mysqlDb
      .select()
      .from(queryResultTable)
      .where(and(eq(queryResultTable.queryIri, decodedQueryIri), eq(queryResultTable.queryResultSetId, queryResultSet.id)));
    const queryResult = queryResultRows[0];

    if (!queryResult) {
      throw createError("Query result not found");
    }

    if (queryType === IMQType.COHORT) {
      const whereClause = eq(cohortResultsTable.queryResultId, queryResult.id);
      const cohortResults = await mysqlDb.select().from(cohortResultsTable).where(whereClause).limit(limit).offset(offset);
      const totalResult = await mysqlDb.select({ count: count() }).from(cohortResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = cohortResults;
      returnObject.totalCount = totalCount;
    } else if (queryType === IMQType.DATASET) {
      const whereClause = eq(datasetResultsTable.queryResultId, queryResult.id);
      const datasetResults = await mysqlDb.select().from(datasetResultsTable).where(whereClause).limit(limit).offset(offset);
      const totalResult = await mysqlDb.select({ count: count() }).from(datasetResultsTable).where(whereClause);
      const totalCount = totalResult[0]?.count ?? 0;
      returnObject.result = datasetResults;
      returnObject.totalCount = totalCount;
    }
  }

  return returnObject;
});
