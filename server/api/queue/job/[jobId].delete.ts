import { eq } from "drizzle-orm";
import * as z from "zod";

import { mysqlDb } from "../../../db/mysql";
import { jobTable } from "../../../db/mysql/schema";

const paramSchema = z.object({
  jobId: z.string()
});

export default defineEventHandler(async event => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  console.log("Deleting job with ID:", jobId);
  const items = await mysqlDb
    .select()
    .from(jobTable)
    .where(eq(jobTable.id, Number(jobId)));
  const item = items[0];
  if (item) {
    await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
