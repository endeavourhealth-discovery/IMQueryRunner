import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";

import { SQL, and, desc, eq, lte } from "drizzle-orm";
import * as z from "zod";

// The queue table offers page sizes up to 8 x 25, so 200 is the largest size the UI asks for
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(200).default(25),
  date: z.iso.date().optional()
});

export default defineEventHandler(async event => {
  // The session already carries the user id (the same id stored on each job), so no Casdoor round trip is needed
  const { user } = await requireUserSession(event);
  // The list itself only needs the session cookie, but the Casdoor tokens can expire (or be lost on a restart) while the cookie is still valid.
  // Checking them here makes a stale session redirect to login on page load rather than on the first action that calls IMAPI.
  await getAccessToken(event);
  const { page, size, date } = await getValidatedQuery(event, querySchema.parse);

  const userId = user.id;

  const filters: SQL[] = [eq(jobTable.userId, userId)];
  if (date) filters.push(lte(jobTable.queueDate, date));

  const [totalCount, result] = await Promise.all([
    mysqlDb.$count(jobTable, eq(jobTable.userId, userId)),
    mysqlDb
      .select()
      .from(jobTable)
      .where(and(...filters))
      .orderBy(desc(jobTable.queueDate))
      .offset((page - 1) * size)
      .limit(size)
  ]);

  return { result, totalCount, page };
});
