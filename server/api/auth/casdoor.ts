import { PrismaClient as MYSQLPrismaClient } from "~~/prisma/generated/mysql";
import { getUserFromToken } from "~~/server/api/auth/getUserFromToken";
import { authenticateToken } from "./authenticateToken";

const mysqlPrisma = new MYSQLPrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const res = await authenticateToken(body.code);

  const user = await getUserFromToken(res);

  return res;
});
