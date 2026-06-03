import Logger from "#shared/logger";
import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";

import { SQL, and, desc, eq, lte } from "drizzle-orm";
import * as z from "zod";

const querySchema = z.object({
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(25),
  date: z.iso.date().optional()
});

export default defineEventHandler(async event => {
  const LOG = Logger("api/queue/user");
  const user = await globalThis.apiGuard.getUser(event);

  const { page, size, date } = await getValidatedQuery(event, querySchema.parse);

  const userId = user!.id;

  const totalCount = await mysqlDb.$count(jobTable, eq(jobTable.userId, userId));

  const filters: SQL[] = [];
  // if (user?.groups.includes("Endeavour/Admin")) // Admins can see all jobs, so no userId filter is added
  filters.push(eq(jobTable.userId, userId));

  if (date) filters.push(lte(jobTable.queueDate, date));

  let qry = mysqlDb
    .select()
    .from(jobTable)
    .where(and(...filters))
    .orderBy(desc(jobTable.queueDate))
    .offset((+page - 1) * +size)
    .limit(size);

  const rs = await qry.execute();

  const items = rs;

  return {
    result: items,
    totalCount,
    page: page
  };
});
