import Logger from "#shared/logger";
import type { QueryResultSummary } from "~~/models";
import { getJobForUser, getJobResultSummaries } from "~~/server/helpers/mysqlHelper";

import { IMQType } from "@endeavour/vue-library";

import { z } from "zod";

const querySchema = z.object({
  jobIds: z.string()
});

export default defineEventHandler(async event => {
  const LOG = Logger("api/queue/job/results/summaries");
  const { user } = await requireUserSession(event);
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
        const job = await getJobForUser(jobId, user.id);
        jobResults.push(...(await getJobResultSummaries(accessToken, job)));
      } catch (error: any) {
        jobError = error?.message ?? String(error);
        LOG.error(`Failed to get result summaries for job ${jobId}: ${jobError}`);
      }
      results.push({ jobId: jobId.toString(), resultsSummary: jobResults, ...(jobError && { error: jobError }) });
    }
  }
  return results;
});
