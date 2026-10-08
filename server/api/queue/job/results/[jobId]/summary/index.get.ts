import type { QueryResultSummary } from "~~/models";
import { getJobById, getJobResultSummaries } from "~~/server/helpers/mysqlHelper";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const accessToken = await getAccessToken(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await getJobById(jobId);
  const results: QueryResultSummary[] = await getJobResultSummaries(accessToken, job);
  return results;
});
