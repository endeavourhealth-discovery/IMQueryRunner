import { z } from "zod";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { jobTable } from "~~/server/db/postgres/schema";
import { imapi } from "~~/server/utils/imapi";
import { hashQueryRequest } from "~~/server/utils/executeQuery";
import type { QueryRequest } from "~~/models/AutoGen";
import { mysqlDb } from "~~/server/db/mysql";
import { sql } from "drizzle-orm";

const paramSchema = z.object({
  queueId: z.string(),
});

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  const { queueId } = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, queueId),
  });
  if (item?.queryRequest) {
    const queryRequestForSQL = await imapi.getQueryRequestForSQL(
      sessionId!,
      item.queryRequest as QueryRequest,
    );
    if (!queryRequestForSQL.query.iri)
      throw new Error("Query IRI is required for execution");
    const hashcode = hashQueryRequest(queryRequestForSQL);
    var sqlToRun = "";
    if (queryRequestForSQL.query.queryType === "DATASET")
      sqlToRun = `SELECT * FROM dataset WHERE hash = ${hashcode}`;
    else sqlToRun = `SELECT * FROM cohort WHERE hash = ${hashcode}`;
    const results = await mysqlDb.execute(sql.raw(sqlToRun));
    return results[0];
  }
});
