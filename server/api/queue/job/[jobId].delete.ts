import Logger from "#shared/logger";
import { deleteJobData, getJobForUser } from "~~/server/helpers/mysqlHelper";

import * as z from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

const LOG = Logger("api/queue/job/delete");

export default defineEventHandler(async event => {
  const { user } = await requireUserSession(event);
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  LOG.info(`Deleting job with ID: ${jobId}`);
  const job = await getJobForUser(jobId, user.id);
  await deleteJobData(job);
});
