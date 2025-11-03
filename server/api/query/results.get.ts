import hash from "object-hash";
import { $fetch } from "ofetch";
import { mysqlDb } from "~~/server/db/mysql";
import { type QueryRequest, Resource, Action } from "~~/models/AutoGen";
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
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.QUERY_RESULTS,
    Action.READ
  );
  const queryRequest: QueryRequest = await readBody(event);
  const cachedResults = getCachedQueryResults(queryRequest);
  if (cachedResults) return cachedResults;
  else throw createError("Query results not found. Please run the query.");
});
