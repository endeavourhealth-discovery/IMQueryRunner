import type { QueryResultSummary } from "~~/models";
import { getJobById, getQueryResultRows, getQueryResultSetRows, getQueryResultSummary } from "~~/server/helpers/mysqlHelper";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const sessionId = getCookie(event, "session_id")!;
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const results: QueryResultSummary[] = [];

  const job = await getJobById(Number(jobId));

  const queryResultSetRows = await getQueryResultSetRows(job);
  for (const queryResultSet of queryResultSetRows) {
    const queryResultRows = await getQueryResultRows(queryResultSet.id);
    for (const queryResultRow of queryResultRows) {
      results.push(await getQueryResultSummary(sessionId, queryResultSet.id, queryResultRow.id, queryResultRow.queryIri, queryResultRow.queryType));
    }
  }
  return results;
});
