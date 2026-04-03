import { z } from "zod";
import { eq } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";
import { sql } from "drizzle-orm";
import { jobTable } from "~~/server/db/mysql/schema";

const paramSchema = z.object({
  jobId: z.string(),
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
});

export default defineEventHandler(async (event) => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const { page, size } = await getValidatedQuery(event, querySchema.parse);

  const job = await mysqlDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, Number(jobId)),
  });

  if (!job) {
    throw createError("Job not found");
  }

  const limit = size;
  const offset = (page - 1) * size;

  let dataSql = "";
  let countSql = "";
  if (job.queryType === "DATASET") {
    dataSql = `SELECT * FROM dataset.dataset WHERE hash = ${job.hash} LIMIT ${limit} OFFSET ${offset}`;
    countSql = `SELECT COUNT(*) AS total FROM dataset.dataset WHERE hash = ${job.hash}`;
  } else if (job.queryType === "COHORT") {
    dataSql = `SELECT * FROM dataset.cohort WHERE hash = ${job.hash} LIMIT ${limit} OFFSET ${offset}`;
    countSql = `SELECT COUNT(*) AS total FROM dataset.cohort WHERE hash = ${job.hash}`;
  } else throw createError("Unsupported query type: " + job.queryType);

  const [dataRows] = await mysqlDb.execute(sql.raw(dataSql));
  const [countRows]: any = await mysqlDb.execute(sql.raw(countSql));

  const total = countRows[0]?.total ?? 0;

  return {
    result: dataRows,
    totalCount: total,
    page: page,
  };
});
