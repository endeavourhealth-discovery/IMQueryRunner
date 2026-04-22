import { postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId)
  });

  return item;
});
