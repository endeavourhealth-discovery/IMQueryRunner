import { z } from "zod";
import { eq } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/mysql/schema";

const paramSchema = z.object({
  jobId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  console.log("Deleting job with ID:", jobId);
  const item = await mysqlDb.query.jobTable.findFirst({
    where: eq(jobTable.id, Number(jobId)),
  });
  if (item) {
    await mysqlDb.delete(jobTable).where(eq(jobTable.id, item.id));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
