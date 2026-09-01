import { JobStatus } from "~~/enums";

import { eq } from "drizzle-orm";
import * as z from "zod";

import { mysqlDb } from "../../../db/mysql";
import { cohortResultsTable, jobTable, queryResultSetTable, queryResultTable } from "../../../db/mysql/schema";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  console.log("Deleting job with ID:", jobId);
  const items = await mysqlDb
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  const item = items[0];
  if (item) {
    if (item.status !== JobStatus.QUEUED) {
      const resultSetIds = await mysqlDb.select().from(queryResultSetTable).where(eq(queryResultSetTable.jobId, item.id));
      const resultSetId = resultSetIds[0];
      if (resultSetId) {
        const resultIds = await mysqlDb.select().from(queryResultTable).where(eq(queryResultTable.queryResultSetId, resultSetId.id));
        const resultId = resultIds[0];
        if (resultId) {
          try {
            await mysqlDb.delete(cohortResultsTable).where(eq(cohortResultsTable.queryResultId, resultId.id));
            await mysqlDb.delete(queryResultTable).where(eq(queryResultTable.id, resultId.id));
            await mysqlDb.delete(queryResultSetTable).where(eq(queryResultSetTable.jobId, item.id));
            await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
          } catch (err) {
            console.error(err);
            throw createError("Error deleting job id:" + item.id);
          }
        } else {
          throw createError("Query result data not found for job id: " + jobId);
        }
      } else {
        await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
        throw createError("Query result set data not found for job id: " + jobId);
      }
    } else {
      await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
    }
  } else {
    throw createError("Query queue item not found for job id: " + jobId);
  }
});
