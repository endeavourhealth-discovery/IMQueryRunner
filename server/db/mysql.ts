import { drizzle } from "drizzle-orm/mysql2";

export const mysqlDb = drizzle(process.env.MYSQL_URL!);
