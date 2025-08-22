import { PrismaClient } from "@@/prisma/generated/mysql";
import hash from "object-hash";
import { QueryRequest } from "~~/models/AutoGen";
import { getCachedResults } from "~~/server/rabbitmq/rabbitmq";
import { $fetch } from "ofetch";

const prisma = new PrismaClient();

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
      return await prisma.$queryRawUnsafe(sql);
    }
  }
});
