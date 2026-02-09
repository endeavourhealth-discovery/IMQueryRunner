import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq, sql } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";
import hash from "object-hash";
import { mysqlDb } from "~~/server/db/mysql";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, queueId),
  });

  if (item?.queryRequest) {
    const requestHash = hash(item.queryRequest);

    const results = await mysqlDb.execute(
      sql.raw(`SELECT * FROM imqcache.${requestHash}`),
    );

    return results[0];
  }
});
