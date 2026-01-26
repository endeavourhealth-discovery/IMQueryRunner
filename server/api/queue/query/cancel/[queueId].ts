import { JobStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { queryQueue } from "~~/server/db/postgres/schema";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.queryQueue.findFirst({
    where: eq(queryQueue.id, queueId),
  });
  if (item) {
    await postgresDb
      .update(queryQueue)
      .set({
        status: JobStatus.CANCELLED,
        stoppedAt: new Date().toISOString(),
      })
      .where(eq(queryQueue.id, item.id));
  } else {
    createError("Query queue item not found for id: " + queueId);
  }
});
