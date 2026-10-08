import Logger from "#shared/logger";
import type { QueryResultSummary } from "~~/models";
import { errorMessage, getJobsResultSummaries } from "~~/server/helpers/jobSummaries";
import { getJobsForUser } from "~~/server/helpers/mysqlHelper";

import { z } from "zod";

// The queue page shows at most 8 x 25 jobs, so no honest request needs more ids than that
const MAX_JOB_IDS = 200;

const querySchema = z.object({
  jobIds: z
    .string()
    .transform(value =>
      value
        .split(",")
        .filter(id => id.trim() !== "")
        .map(Number)
    )
    .pipe(z.array(z.number().int()).max(MAX_JOB_IDS))
});

export default defineEventHandler(async event => {
  const LOG = Logger("api/queue/job/results/summaries");
  const { user } = await requireUserSession(event);
  const accessToken = await getAccessToken(event);
  const { jobIds } = await getValidatedQuery(event, querySchema.parse);

  const jobs = await getJobsForUser(jobIds, user.id);
  const summaries = await getJobsResultSummaries(accessToken, user.id, jobs);
  const summaryByJobId = new Map(summaries.map(summary => [summary.job.id, summary]));

  // One entry per requested id, in request order. Ids that are missing or not the caller's report "not found", as before
  const results: { jobId: string; resultsSummary: QueryResultSummary[]; error?: string }[] = jobIds.map(jobId => {
    const summary = summaryByJobId.get(jobId);
    if (!summary) return { jobId: jobId.toString(), resultsSummary: [], error: "Queue job not found" };
    if (summary.error === undefined) return { jobId: jobId.toString(), resultsSummary: summary.summaries };

    const message = errorMessage(summary.error);
    LOG.error(`Failed to get result summaries for job ${jobId}: ${message}`);
    return { jobId: jobId.toString(), resultsSummary: [], error: message };
  });
  return results;
});
