import z from "zod";
import { QueueItemStatus } from "~~/enums/QueueItemStatus";
import { postgresDb } from "~~/server/db/postgres/postgres";
import {
  queueItem,
  selectQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import { desc, eq } from "drizzle-orm";
import { Action, Resource } from "~~/models/AutoGen";

const querySchema = z.object({
  status: z.enum(QueueItemStatus),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
});

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY,
    Action.EXECUTE
  );
  const { status, page, size } = await getValidatedQuery(
    event,
    querySchema.parse
  );
  const totalCount = await postgresDb.$count(
    queueItem,
    eq(queueItem.status, status)
  );

  const rs = await postgresDb.query.queueItem.findMany({
    where: eq(queueItem.status, status),
    orderBy: [desc(queueItem.queuedAt)],
    offset: (+page - 1) * +size,
    limit: size,
  });

  const items = rs.map((row) => selectQueueItemSchema.parse(row));
  return {
    result: items,
    totalCount,
    page: page,
  };
});
