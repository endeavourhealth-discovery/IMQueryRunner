import { QueueItemStatus } from "~~/enums";
import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq, sql } from "drizzle-orm";
import { queueItem } from "~~/server/db/postgres/schema";
import hash from "object-hash";
import { mysqlDb } from "~~/server/db/mysql";

const paramSchema = z.object({
  queueItemId: z.string(),
});

export default defineEventHandler(async (event) => {
  globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  if (!user) {
    throw createError("Unauthorized");
  }
  const { queueItemId } = await getValidatedRouterParams(
    event,
    paramSchema.parse
  );
  const item = await postgresDb.query.queueItem.findFirst({
    where: eq(queueItem.id, queueItemId),
  });

  if (!item) {
    throw createError("Query queue item not found for id: " + queueItemId);
  }

  if (item?.queryRequest) {
    const requestHash = hash(item.queryRequest);
    // return paged results from mysql imqcache
    const results = await mysqlDb.execute(
      sql.raw(`SELECT * FROM imqcache.${requestHash}`)
    );

    return results[0];
  }
});
