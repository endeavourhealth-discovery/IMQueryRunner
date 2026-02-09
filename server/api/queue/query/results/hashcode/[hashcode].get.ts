import { z } from "zod";
import { sql } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";

const paramSchema = z.object({
  hashcode: z.string(),
});

export default defineEventHandler(async (event) => {
  const { hashcode } = await getValidatedRouterParams(event, paramSchema.parse);
    const results = await mysqlDb.execute(
      sql.raw(`SELECT * FROM dataset WHERE hashcode = ${hashcode}`),
    );
    return results[0];
});
