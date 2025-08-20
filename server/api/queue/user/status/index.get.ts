import { PrismaClient } from "@@/prisma/generated/postgres";
import { QueueItemStatus } from "~~/enums";
import { isQueueItemStatus } from "~~/enums/QueueItemStatus";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  if (queryParams.userId?.valueOf() !== "string")
    throw createError("userId is required");
  const userId = queryParams.userId.toString();
  if (
    queryParams.status?.valueOf() !== "string" ||
    isQueueItemStatus(queryParams.status?.toString())
  )
    throw createError("status is required");
  const status = queryParams.status.toString();
  const page: number =
    queryParams.page?.valueOf() === "number"
      ? parseInt(queryParams.page.toString())
      : 1;
  const size: number =
    queryParams.size?.valueOf() === "number"
      ? parseInt(queryParams.size.toString())
      : 2;
  const totalCount = await prisma.queueItem.count({
    where: {
      user_id: { equals: userId },
      status: { equals: status },
    },
  });
  const items = await prisma.queueItem.findMany({
    where: {
      user_id: { equals: userId },
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
