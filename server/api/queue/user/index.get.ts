import { PrismaClient } from "@@/prisma/generated/postgres";
import z from "zod";
import { QueueItem } from "~~/models";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";

const prisma = new PrismaClient();

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { page, size, userId } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await prisma.queueItem.count({
    where: {
      user_id: { equals: userId },
    },
  });
  const items = await prisma.queueItem.findMany({
    where: {
      user_id: { equals: userId },
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
