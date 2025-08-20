import { PrismaClient } from "@@/prisma/generated/postgres";
import { QueueItemStatus } from "~~/enums";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const queueId = getRouterParam(event, "queueId");
  const item = await prisma.queueItem.findFirst({
    where: { id: { equals: queueId } },
  });
  if (item) {
    const activeQuery = prisma.$queryRaw`
    SELECT * FROM pg_stat_activity WHERE state = 'active' LIMIT 1
    `;
    const result = prisma.$queryRaw`
    SELECT pg_cancel_backend(${activeQuery})
    `;
    if (!result) {
      prisma.$queryRaw`
      SELECT pg_terminate_backend(${activeQuery})
      `;
    }
    await prisma.queueItem.update({
      where: { id: item.id },
      data: { status: QueueItemStatus.CANCELLED, killed_at: new Date() },
    });
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
