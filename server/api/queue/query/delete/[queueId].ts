import { PrismaClient } from "@@/prisma/generated/postgres";
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
    await prisma.queueItem.delete({
      where: { id: item.id },
    });
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
