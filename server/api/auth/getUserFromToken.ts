import { PrismaClient as MYSQLPrismaClient } from "~~/prisma/generated/mysql";

const mysqlPrisma = new MYSQLPrismaClient();

export async function getUserFromToken(token: string) {
  const user =
    await mysqlPrisma.$queryRaw`GET /api/get-account?access_token=${token}`;
  return user;
}
