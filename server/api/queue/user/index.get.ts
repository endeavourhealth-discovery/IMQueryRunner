import { PrismaClient } from "@@/prisma/generated/postgres";
import { QueueItem } from "~~/models";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  if (typeof queryParams.userId !== "string")
    throw createError("userId is required");
  const userId = queryParams.userId.toString();
  const page: number =
    typeof queryParams.page === "number"
      ? parseInt(queryParams.page.toString())
      : 1;
  const size: number =
    typeof queryParams.size === "number"
      ? parseInt(queryParams.size.toString())
      : 2;

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
