import hash from "object-hash";
import { getCachedResults } from "~~/server/rabbitmq/rabbitmq";
import { $fetch } from "ofetch";
import {mysqlDb} from "~~/server/db/mysql";
import type {QueryRequest} from "~~/models/AutoGen";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get results of query",
    requestBody: {
      description: "Query Request object",
      content: {
        "application/json": {
          description: "Query Request object",
          schema: {type: "object"}
        }
      }
    }
  },
});

export default defineEventHandler(async (event) => {
  const queryRequest: QueryRequest = await readBody(event);
  const cachedResults = getCachedResults(hash(queryRequest));
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