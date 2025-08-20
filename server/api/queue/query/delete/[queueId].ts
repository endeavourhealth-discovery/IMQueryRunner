import { PrismaClient } from "@@/prisma/generated/postgres";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const queueId = getRouterParam(event, "queueId");
  const item = await prisma.queueItem.findFirst({
    where: { id: { equals: queueId } },
  });
  if (item) {
    await prisma.queueItem.delete({
      where: { id: item.id },
    });
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
