import type { QueryResultSummary } from "~~/models";
import { getJobById, getQueryResultRows, getQueryResultSetRows, getQueryResultSummary } from "~~/server/helpers/mysqlHelper";

import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

const querySchema = z.object({
  jobIds: z.string()
});

export default defineEventHandler(async event => {
  const sessionId = getCookie(event, "session_id")!;
  const { jobIds } = await getValidatedQuery(event, querySchema.parse);
  const results: { jobId: string; resultsSummary: QueryResultSummary[] }[] = [];
  for (const jobId of jobIds.split(",").map(j => Number(j))) {
    const jobResults: QueryResultSummary[] = [];
    const job = await getJobById(Number(jobId));

    const queryResultSetRows = await getQueryResultSetRows(job);
    for (const queryResultSet of queryResultSetRows) {
      const queryResultRows = await getQueryResultRows(queryResultSet.id);
      for (const queryResultRow of queryResultRows) {
        jobResults.push(await getQueryResultSummary(sessionId, queryResultSet.id, queryResultRow.id, queryResultRow.queryIri, queryResultRow.queryType));
      }
    }
    results.push({ jobId: jobId.toString(), resultsSummary: jobResults });
  }
  return results;
});
