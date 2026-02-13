import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";
import { imapi } from "~~/server/utils/imapi";
import { hashQueryRequest } from "~~/server/utils/executeQuery";
import type { QueryRequest } from "~~/models/AutoGen";
import { mysqlDb } from "~~/server/db/mysql";
import { sql } from "drizzle-orm";

const paramSchema = z.object({
  jobId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const job = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId),
  });
  if (!job) {
    throw createError("Job not found");
  }

  var sqlToRun = "";
  if (job?.queryType === "DATASET")
    sqlToRun = `SELECT * FROM dataset WHERE hash = ${job.queryHash}`;
  else sqlToRun = `SELECT * FROM cohort WHERE hash = ${job.queryHash}`;
  const results = await mysqlDb.execute(sql.raw(sqlToRun));
  return results[0];
});
