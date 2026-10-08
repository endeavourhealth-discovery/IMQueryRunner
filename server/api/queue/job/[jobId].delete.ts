import { JobStatus } from "~~/enums";
import { getJobForUser, getQueryResultSetRows } from "~~/server/helpers/mysqlHelper";

import { eq } from "drizzle-orm";
import * as z from "zod";

import { mysqlDb } from "../../../db/mysql";
import { cohortResultsTable, jobTable, queryResultSetTable, queryResultTable } from "../../../db/mysql/schema";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  console.log("Deleting job with ID:", jobId);
  const job = await getJobForUser(jobId, user.id);
  if (job.status === JobStatus.QUEUED) {
    await mysqlDb.delete(jobTable).where(eq(jobTable.id, job.id));
    return;
  }

  const resultSetRows = await getQueryResultSetRows(job);
  for (const resultSet of resultSetRows) {
    const results = await mysqlDb.select().from(queryResultTable).where(eq(queryResultTable.queryResultSetId, resultSet.id));
    for (const result of results) {
      await mysqlDb.delete(cohortResultsTable).where(eq(cohortResultsTable.queryResultId, result.id));
      await mysqlDb.delete(queryResultTable).where(eq(queryResultTable.id, result.id));
    }
    await mysqlDb.delete(queryResultSetTable).where(eq(queryResultSetTable.jobId, job.id));
  }
  await mysqlDb.delete(jobTable).where(eq(jobTable.id, job.id));
});
