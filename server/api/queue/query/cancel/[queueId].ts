import { PrismaClient } from "@@/prisma/generated/postgres";
import { QueueItemStatus } from "~~/enums";
import { z } from "zod";

const prisma = new PrismaClient();

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await prisma.queueItem.findFirst({
    where: { id: { equals: queueId } },
  });
  if (item) {
    await prisma.queueItem.update({
      where: { id: item.id },
      data: { status: QueueItemStatus.CANCELLED, killed_at: new Date() },
    });
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
