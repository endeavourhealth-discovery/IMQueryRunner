import { PrismaClient } from "@@/prisma/generated/mysql";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  await prisma.$queryRaw``;
  return "Hello queries";
});
