import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import {postgresDb} from "~~/server/db/postgres";
import {eq} from "drizzle-orm";
import {queueItem} from "~~/server/db/postgres/schema";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueId ),
  });

  return item;
});