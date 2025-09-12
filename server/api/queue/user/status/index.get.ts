import z from "zod";
import { QueueItemStatus } from "~~/enums";
import {pgQueueItemSelect, postgresDb} from "~~/server/db/postgres";
import {and, desc, eq} from "drizzle-orm";
import {queueItem} from "~~/server/db/postgres/schema";

const querySchema = z.object({
  status: z.enum(QueueItemStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { status, page, size, userId } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await postgresDb.$count(queueItem,
    and(
      eq(queueItem.userId, userId),
      eq(queueItem.status, status)
    )
  );

  const rs = await postgresDb.query.queueItem.findMany({
    where: and(
      eq(queueItem.userId, userId),
      eq(queueItem.status, status)
    ),
    orderBy: [desc(queueItem.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size
  });
  const items = rs.map((row) => pgQueueItemSelect.parse(row));
  return {
    result: items,
    totalCount,
    page: page,
  };
});
