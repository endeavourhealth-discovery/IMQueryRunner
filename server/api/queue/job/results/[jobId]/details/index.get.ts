import { ErrorCode } from "~~/enums";
import type { QueryResultDetails } from "~~/models";
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
import EntityService from "~~/server/services/EntityService";
import { getDebugPatientId } from "~~/server/utils/executeQuery";

import { isArrayHasLength } from "@endeavour/vue-library";
import { IMQType } from "@endeavour/vue-library/enums";

import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const sessionId = getCookie(event, "session_id")!;
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const results: QueryResultDetails[] = [];
  const items = await mysqlDb
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  if (isArrayHasLength(items)) {
    const job = items[0];
    const queryResultSetRows = await mysqlDb
      .select()
      .from(queryResultSetTable)
      .where(eq(queryResultSetTable.jobId, Number(jobId)));
    if (isArrayHasLength(queryResultSetRows)) {
      for (const queryResultSet of queryResultSetRows) {
        const queryType = job.queryRequests.filter(qr => qr.query?.iri === queryResultSet.queryIri)[0]?.query?.queryType;
        const queryResultRows = await mysqlDb.select().from(queryResultTable).where(eq(queryResultTable.queryResultSetId, queryResultSet.id));
        if (isArrayHasLength(queryResultRows)) {
          for (const queryResultRow of queryResultRows) {
            if (queryType === IMQType.COHORT) {
              const countResult = await mysqlDb
                .select({ count: count() })
                .from(cohortResultsTable)
                .where(eq(cohortResultsTable.queryResultId, queryResultRow.id));
              if (isArrayHasLength(countResult)) {
                const name = (await EntityService.getEntitySummary(sessionId, queryResultRow.queryIri)).name ?? "";
                results.push({ totalCount: countResult[0].count, queryName: name });
              }
            } else if (queryType === IMQType.DATASET) {
              const countResult = await mysqlDb
                .select({ count: count() })
                .from(datasetResultsTable)
                .where(eq(datasetResultsTable.queryResultId, queryResultRow.id));
              if (isArrayHasLength(countResult)) {
                const name = (await EntityService.getEntitySummary(sessionId, queryResultRow.queryIri)).name ?? "";
                results.push({ totalCount: countResult[0].count, queryName: name });
              }
            } else if (queryType === IMQType.INDICATOR) {
              const countResult = await mysqlDb
                .select({ count: count() })
                .from(indicatorResultTable)
                .where(eq(indicatorResultTable.queryResultSetId, queryResultSet.id));
              if (isArrayHasLength(countResult)) {
                const name = (await EntityService.getEntitySummary(sessionId, queryResultRow.queryIri)).name ?? "";
                results.push({ totalCount: countResult[0].count, queryName: name });
              }
            } else {
              throw createError({ status: 400, statusText: ErrorCode.InvalidRequestError, message: "Query type is invalid" });
            }
          }
        } else {
          throw createError({ status: 404, statusText: ErrorCode.MissingDataError, message: "Query result not found" });
        }
      }
    } else {
      throw createError({ status: 404, statusText: ErrorCode.MissingDataError, message: "Query result set not found" });
    }
  }
  return results;
});
