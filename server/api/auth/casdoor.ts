import { PrismaClient as MYSQLPrismaClient } from "~~/prisma/generated/mysql";

const mysqlPrisma = new MYSQLPrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const res = await $fetch(
    process.env.CASDOOR_URL! + "api/login/oauth/access_token",
    {
      method: "POST",
      body: {
        code: body.code,
        client_id: process.env.CASDOOR_CLIENT_ID,
        client_secret: process.env.CASDOOR_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/callback",
      },
    }
  );

  const user = mysqlPrisma.$queryRaw`GET /api/get-account?access_token=${res}`;

  return res;
});
