import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";
import hash from "object-hash";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.id, queueId),
  });

  if (item?.queryRequest) {
      const requestHash = hash(item.queryRequest);
      const results = await $fetch(`/api/queue/query/results/hashcode/${requestHash}`) as any;

      return results[0];
  }
});
