import z from "zod";
import {pgQueueItemSelect, postgresDb} from "~~/server/db/postgres";
import {queueItem} from "~~/server/db/postgres/schema";
import {and, desc, eq, lte, SQL} from "drizzle-orm";
import Logger from "#shared/logger";

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  date: z.iso.date().optional(),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("api/queue/user");
  const user = globalThis.security.getUser(event);

  const { page, size, userId, date } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await postgresDb.$count(queueItem, eq(queueItem.userId, userId));

  const filters: SQL[] = [];
  // if (!user?.groups.includes("Endeavour/Admin"))
    filters.push(eq(queueItem.userId, userId));
  if (date)
    filters.push(lte(queueItem.queuedAt, date));

  let qry = postgresDb.select()
    .from(queueItem)
    .where(and(...filters))
    .orderBy(desc(queueItem.queuedAt))
    .offset((+page - 1) * +size)
    .limit(size);

  LOG.debug(qry.toSQL().sql)

  const rs = await qry.execute();

  const items = rs.map((row) => pgQueueItemSelect.parse(row));

  return {
    result: items,
    totalCount,
    page: page,
  };
});