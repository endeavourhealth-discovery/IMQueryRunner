import { QueueItemStatus } from "~~/enums";
import { unknown, z } from "zod";
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
  page: z.number().default(1),
  size: z.number().default(25),
});

export default defineEventHandler(
  async (event): Promise<{ results: string[]; totalCount: number }> => {
    await globalThis.authenticator.requireUser(event);
    const user = globalThis.authenticator.getUser(event);
    await globalThis.guard.requirePermission(
      user!,
      Resource.QUERY_RESULTS,
      Action.READ
    );
    const { queueItemId, page, size } = await getValidatedRouterParams(
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
      const count = await mysqlDb.execute(
        sql<{
          total: number;
        }>`SELECT COUNT(*) AS total FROM imqcache.${requestHash}`
      );
      const results = await mysqlDb.execute(
        sql<{ id: string }>`
        SELECT * FROM imqcache.${requestHash}
        ORDER BY id DESC
        LIMIT ${size}
        OFFSET ${(page - 1) * size}`
      );

      return {
        results: (results as unknown as { id: string }[]).map((r) => r.id),
        totalCount: Number((count as unknown as { total: number }[])[0].total),
      };
    }
    return { results: [], totalCount: 0 };
  }
);
