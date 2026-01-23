import z from "zod";
import { QueueItemStatus } from "~~/enums/QueueItemStatus";
import { pgQueueItemSelect, postgresDb } from "~~/server/db/postgres";
import { queryQueue } from "~~/server/db/postgres/schema";
import { desc, eq } from "drizzle-orm";

const querySchema = z.object({
  status: z.enum(QueueItemStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
});

export default defineEventHandler(async (event) => {
  const { status, page, size } = await getValidatedQuery(
    event,
    querySchema.parse,
  );
  const totalCount = await postgresDb.$count(
    queryQueue,
    eq(queryQueue.status, status),
  );

  const rs = await postgresDb.query.queryQueue.findMany({
    where: eq(queryQueue.status, status),
    orderBy: [desc(queryQueue.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size,
  });

  const items = rs.map((row) => pgQueueItemSelect.parse(row));
  return {
    result: items,
    totalCount,
    page: page,
  };
});
