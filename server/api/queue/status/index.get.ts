import z from "zod";
import { JobStatus } from "~~/enums/JobStatus";
import { pgJobSelect, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { desc, eq } from "drizzle-orm";

const querySchema = z.object({
  status: z.enum(JobStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
});

export default defineEventHandler(async (event) => {
  const { status, page, size } = await getValidatedQuery(
    event,
    querySchema.parse,
  );
  const totalCount = await postgresDb.$count(
    jobTable,
    eq(jobTable.status, status),
  );

  const rs = await postgresDb.query.jobTable.findMany({
    where: eq(jobTable.status, status),
    orderBy: [desc(jobTable.queueDate)],
    offset: (+page - 1) * +size,
    limit: size,
  });

  const items = rs.map((row) => pgJobSelect.parse(row));
  return {
    result: items,
    totalCount,
    page: page,
  };
});
