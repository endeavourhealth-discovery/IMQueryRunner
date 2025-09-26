import hash from "object-hash";
import { $fetch } from "ofetch";
import { mysqlDb } from "~~/server/db/mysql";
import type { QueryRequest } from "~~/models/AutoGen";
import { getCachedQueryResults } from "~~/server/utils/executeQuery";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get results of query",
    requestBody: {
      description: "Query Request object",
      content: {
        "application/json": {
          description: "Query Request object",
          schema: { type: "object" },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  const queryRequest: QueryRequest = await readBody(event);
  const cachedResults = getCachedQueryResults(queryRequest);
  if (cachedResults) return cachedResults;
  else {
    const sql = await $fetch(process.env.IMAPI_URL! + "query/public/sql", {
      body: queryRequest,
      method: "post",
    });
    if (sql) {
      return await mysqlDb.execute(sql);
    }
  }
});
