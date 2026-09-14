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
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: `Query queue item not found for job id: ${jobId}`
    });
  }
  if (item.status === JobStatus.QUEUED) {
    await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
    return;
  }

  const resultSets = await mysqlDb.select().from(queryResultSetTable).where(eq(queryResultSetTable.jobId, item.id));
  if (resultSets.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Query result set data not found for job id: ${jobId}`
    });
  }
  for (const resultSet of resultSets) {
    const results = await mysqlDb.select().from(queryResultTable).where(eq(queryResultTable.queryResultSetId, resultSet.id));
    for (const result of results) {
      await mysqlDb.delete(cohortResultsTable).where(eq(cohortResultsTable.queryResultId, result.id));
      await mysqlDb.delete(queryResultTable).where(eq(queryResultTable.id, result.id));
    }
    await mysqlDb.delete(queryResultSetTable).where(eq(queryResultSetTable.jobId, item.id));
  }
  await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
});
