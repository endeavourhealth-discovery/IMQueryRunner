import { getJobById } from "~~/server/helpers/mysqlHelper";

import * as z from "zod";

const paramSchema = z.object({
  jobId: z.coerce.number()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  return await getJobById(jobId);
});
