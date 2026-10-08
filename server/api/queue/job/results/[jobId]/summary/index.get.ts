import { getJobsResultSummaries } from "~~/server/helpers/jobSummaries";
import { getJobForUser } from "~~/server/helpers/mysqlHelper";

import { z } from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const accessToken = await getAccessToken(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await getJobForUser(jobId, user.id);
  const [result] = await getJobsResultSummaries(accessToken, user.id, [job]);
  if (result!.error !== undefined) throw result!.error;
  return result!.summaries;
});
