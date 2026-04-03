import { z } from "zod";
import { eq } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";
import { sql } from "drizzle-orm";
import { jobTable } from "~~/server/db/mysql/schema";

const paramSchema = z.object({
  jobId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);

  const job = await mysqlDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, Number(jobId)),
  });

  if (!job) {
    throw createError("Job not found");
  }

  let dataSql = "";
  if (job.queryType === "DATASET")
    dataSql = `SELECT * FROM dataset.dataset WHERE hash = ${job.hash}`;
  else if (job.queryType === "COHORT")
    dataSql = `SELECT * FROM dataset.cohort WHERE hash = ${job.hash}`;
  else throw createError("Unsupported query type: " + job.queryType);
  const [dataRows] = await mysqlDb.execute(sql.raw(dataSql));

  return {
    result: dataRows,
  };
});
