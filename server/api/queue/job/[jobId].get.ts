import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";

import { eq } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await mysqlDb.query.jobTable.findFirst({
    where: eq(jobTable.id, Number(jobId))
  });

  return item;
});
