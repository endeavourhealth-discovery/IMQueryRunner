import { MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./mysql/schema";

if (!process.env.COMPASS_URL) {
  throw new Error("Missing COMPASS_URL environment variable");
}

export const pool = mysql.createPool({
  uri: process.env.COMPASS_URL,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const mysqlDb: MySql2Database<typeof schema> = drizzle({
  client: pool,
  schema,
  mode: "default"
});

export async function getConnectionId(): Promise<number> {
  const conn = await pool.getConnection();
  return conn.threadId;
}
