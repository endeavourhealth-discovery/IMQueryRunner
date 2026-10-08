import type { QueryResultSummary } from "~~/models";
import { getJobForUser, getJobResultSummaries } from "~~/server/helpers/mysqlHelper";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const accessToken = await getAccessToken(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await getJobForUser(jobId, user.id);
  const results: QueryResultSummary[] = await getJobResultSummaries(accessToken, job);
  return results;
});
