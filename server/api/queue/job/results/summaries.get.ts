import Logger from "#shared/logger";
import type { QueryResultSummary } from "~~/models";
import { getJobById, getQueryResultRows, getQueryResultSetRows, getQueryResultSummary } from "~~/server/helpers/mysqlHelper";

import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

const querySchema = z.object({
  jobIds: z.string()
});

export default defineEventHandler(async event => {
  const LOG = Logger("api/queue/job/results/summaries");
  const accessToken = await getAccessToken(event);
  const { jobIds } = await getValidatedQuery(event, querySchema.parse);

  const results: { jobId: string; resultsSummary: QueryResultSummary[]; error?: string }[] = [];

  if (jobIds) {
    const ids = jobIds
      .split(",")
      .filter(j => j.trim() !== "")
      .map(j => Number(j));
    for (const jobId of ids) {
      const jobResults: QueryResultSummary[] = [];
      let jobError: string | undefined;
      try {
        const job = await getJobById(jobId);

        const queryResultSetRows = await getQueryResultSetRows(job);
        for (const queryResultSet of queryResultSetRows) {
          const queryResultRows = await getQueryResultRows(queryResultSet.id);
          for (const queryResultRow of queryResultRows) {
            jobResults.push(await getQueryResultSummary(accessToken, queryResultSet.id, queryResultRow.id, queryResultRow.queryIri, queryResultRow.queryType));
          }
        }
      } catch (error: any) {
        jobError = error?.message ?? String(error);
        LOG.error(`Failed to get result summaries for job ${jobId}: ${jobError}`);
      }
      results.push({ jobId: jobId.toString(), resultsSummary: jobResults, ...(jobError && { error: jobError }) });
    }
  }
  return results;
});
