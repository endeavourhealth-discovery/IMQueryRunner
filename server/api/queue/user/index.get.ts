import z from "zod";
import {pgQueueItemSelect, postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {desc, eq} from "drizzle-orm";
import Logger from "#shared/logger";

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("api/queue/user");

  globalThis.io.to('test-room').emit("message", "Hello from server!");

  const { page, size, userId } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await postgresDb.$count(queueItem, eq(queueItem.userId, userId));

  let qry = postgresDb.select()
    .from(queueItem)
    .orderBy(desc(queueItem.queuedAt))
    .offset((+page - 1) * +size)
    .limit(size);

  const user = globalThis.authenticator.getUser(event);
  if (!user?.groups.includes("Endeavour/Admin")) {
    qry.where(eq(queueItem.userId, userId));
  }

  LOG.trace(qry.toSQL())

  const rs = await qry.execute();

  const items = rs.map((row) => pgQueueItemSelect.parse(row));

  return {
    result: items,
    totalCount,
    page: page,
  };
});