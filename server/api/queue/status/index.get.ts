import { PrismaClient } from "@@/prisma/generated/postgres";
import z from "zod";
import { isQueueItemStatus, QueueItemStatus } from "~~/enums/QueueItemStatus";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";

const prisma = new PrismaClient();

const querySchema = z.object({
  status: z.enum(QueueItemStatus),
  page: z.number().default(1),
  size: z.number().default(25),
});

export default defineEventHandler(async (event) => {
  const { status, page, size } = await getValidatedQuery(
    event,
    querySchema.parse
  );
  const totalCount = await prisma.queueItem.count({
    where: {
      status: { equals: status },
    },
  });
  const items = await prisma.queueItem.findMany({
    where: {
      status: { equals: status },
    },
    orderBy: {
      queued_at: "desc",
    },
    skip: (+page - 1) * +size,
    take: size,
  });
  const itemsAsQueueItem = items.map((item) => schemaToQueueItem(item));
  return {
    result: itemsAsQueueItem,
    totalCount,
    page: page,
  };
});
