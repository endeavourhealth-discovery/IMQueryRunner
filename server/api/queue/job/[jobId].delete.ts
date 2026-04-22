import * as z from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";

const paramSchema = z.object({
  jobId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { jobId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId),
  });
  if (item) {
    await postgresDb.delete(jobTable).where(eq(jobTable.dbid, item.dbid));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
