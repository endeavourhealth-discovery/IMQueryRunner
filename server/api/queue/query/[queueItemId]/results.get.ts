import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres/postgres";
import { eq, sql } from "drizzle-orm";
import {
  queueItem,
  selectQueueItemSchema,
} from "~~/server/db/postgres/schemas/query_runner/schema";
import hash from "object-hash";
import { mysqlDb } from "~~/server/db/mysql/mysql";
import { Action, Resource } from "~~/models/AutoGen";

const paramSchema = z.object({
  queueItemId: z.string(),
});

export default defineEventHandler(async (event) => {
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY_RESULTS,
    Action.READ
  );
  const { queueItemId } = await getValidatedRouterParams(
    event,
    paramSchema.parse
  );
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueItemId),
  });
  const parsed = selectQueueItemSchema.parse(item);

  if (parsed.queryRequest) {
    const requestHash = hash(parsed.queryRequest);
    // return paged results from mysql imqcache
    const results = await mysqlDb.execute(
      sql.raw(`SELECT * FROM imqcache.${requestHash}`)
    );

    return results[0];
  }
});
