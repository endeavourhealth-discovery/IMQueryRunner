import z from "zod";
import { schemaToQueueItem } from "~~/server/helpers/schemaToQueueItem";
import {postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {desc, eq} from "drizzle-orm";


const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  console.log("EMITTING...")
  socketServer.to('test-room').emit("message", "Hello from server!");
  console.log("DONE.")

  const { page, size, userId } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await postgresDb.$count(queueItem, eq(queueItem.userId, userId));
  const items = await postgresDb.query.queueItem.findMany({
    where: eq(queueItem.userId, userId),
    orderBy: [desc(queueItem.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size,
  });
  const itemsAsQueueItem = items.map((item) => schemaToQueueItem(item));
  return {
    result: itemsAsQueueItem,
    totalCount,
    page: page,
  };
});
