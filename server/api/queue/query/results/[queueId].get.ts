import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";
import {imapi} from "~~/server/utils/imapi";
import { hashQueryRequest } from "~~/server/utils/executeQuery";
import type {QueryRequest} from "~~/models/AutoGen";


const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, queueId),
  });

  if (item?.queryRequest) {
      const queryRequestForSQL = await imapi.getQueryRequestForSQL(item.queryRequest as QueryRequest);
      if (!queryRequestForSQL.query.iri)
          throw new Error("Query IRI is required for execution");
      const requestHash = hashQueryRequest(queryRequestForSQL);
      const results = await $fetch(`/api/queue/query/results/hashcode/${requestHash}`) as any;

      return results[0];
  }
});
