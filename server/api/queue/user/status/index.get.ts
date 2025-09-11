import z from "zod";
import { QueueItemStatus } from "~~/enums";
import { isQueueItemStatus } from "~~/enums/QueueItemStatus";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";
import {postgresDb} from "~~/server/db/postgres";
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

  const items = await postgresDb.query.queueItem.findMany({
    where: and(
      eq(queueItem.userId, userId),
      eq(queueItem.status, status)
    ),
    orderBy: [desc(queueItem.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size
  });
  const itemsAsQueueItem = items.map((item) => schemaToQueueItem(item));
  return {
    result: itemsAsQueueItem,
    totalCount,
    page: page,
  };
});
