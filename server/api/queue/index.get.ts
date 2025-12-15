import z from "zod";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  selectQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import { and, desc, eq, lte, SQL } from "drizzle-orm";
import Logger from "#shared/logger";
import { Action, Resource } from "~~/models/AutoGen";

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  date: z.iso.date().optional(),
  userId: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("api/queue/user");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );

  const { page, size, userId, date } = await getValidatedQuery(
    event,
    querySchema.parse
  );

  const totalCount = await postgresDb.$count(
    queueItem,
    eq(queueItem.userId, userId)
  );

  const filters: SQL[] = [];
  // if (!user?.groups.includes("Endeavour/Admin"))
  filters.push(eq(queueItem.userId, userId));
  if (date) filters.push(lte(queueItem.queuedAt, date));

  let qry = postgresDb
    .select()
    .from(queueItem)
    .where(and(...filters))
    .orderBy(desc(queueItem.queuedAt))
    .offset((+page - 1) * +size)
    .limit(size);

  LOG.debug(qry.toSQL().sql);

  const rs = await qry.execute();

  const items = rs.map((row) => selectQueueItemSchema.parse(row));

  return {
    result: items,
    totalCount,
    page: page,
  };
});
