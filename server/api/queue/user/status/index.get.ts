import z from "zod";
import { JobStatus } from "~~/enums";
import { pgJobSelect, postgresDb } from "~~/server/db/postgres";
import { and, desc, eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";

const querySchema = z.object({
  status: z.enum(JobStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { status, page, size, userId } = await getValidatedQuery(
    event,
    querySchema.parse,
  );

  const totalCount = await postgresDb.$count(
    jobTable,
    and(eq(jobTable.userId, userId), eq(jobTable.status, status)),
  );

  const rs = await postgresDb.query.jobTable.findMany({
    where: and(eq(jobTable.userId, userId), eq(jobTable.status, status)),
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
