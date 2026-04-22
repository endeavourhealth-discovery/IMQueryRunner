import { mysqlDb } from "~~/server/db/mysql";
import { postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";

import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import * as z from "zod";

const paramSchema = z.object({
  jobId: z.string()
});

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25)
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const { page, size } = await getValidatedQuery(event, querySchema.parse);

  const job = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId)
  });

  if (!job) {
    throw createError("Job not found");
  }

  const limit = size;
  const offset = (page - 1) * size;

  const dataSql = `SELECT * FROM \`${job.queryHash}\` LIMIT ${limit} OFFSET ${offset}`;
  const countSql = `SELECT COUNT(*) AS total FROM \`${job.queryHash}\``;

  const [dataRows] = await mysqlDb.execute(sql.raw(dataSql));
  const [countRows]: any = await mysqlDb.execute(sql.raw(countSql));

  const total = countRows[0]?.total ?? 0;

  return {
    result: dataRows,
    totalCount: total,
    page: page
  };
});
