import { mysqlDb } from "~~/server/db/mysql";
import { postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";

import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId)
  });

  if (!job) {
    throw createError("Job not found");
  }

  const dataSql = `SELECT * FROM \`${job.queryHash}\``;
  const [dataRows] = await mysqlDb.execute(sql.raw(dataSql));

  return {
    result: dataRows
  };
});
