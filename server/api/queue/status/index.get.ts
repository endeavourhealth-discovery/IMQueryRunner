import z from "zod";
import { isQueueItemStatus, QueueItemStatus } from "~~/enums/QueueItemStatus";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";
import {postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {desc, eq} from "drizzle-orm";

const querySchema = z.object({
  status: z.enum(QueueItemStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
});

export default defineEventHandler(async (event) => {
  const { status, page, size } = await getValidatedQuery(
    event,
    querySchema.parse
  );
  const totalCount = await postgresDb
    .$count(queueItem, eq(queueItem.status, status));

  const items = await postgresDb.query.queueItem.findMany({
    where: eq(queueItem.status, status),
    orderBy: [desc(queueItem.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size,
  });
  const itemsAsQueueItem = items.map((item) => schemaToQueueItem(item));
  return {
    result: itemsAsQueueItem,
    totalCount,
    page: page,
  };
});
