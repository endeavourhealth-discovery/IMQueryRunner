import { MySql2Database, drizzle } from "drizzle-orm/mysql2";
import type { Connection as CoreConnection } from "mysql2";
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

/**
 * Streams the rows of a query one at a time instead of loading them all, for results that can run to millions of rows.
 * Holds one pool connection until the rows run out. If the consumer stops early (or the query fails) the connection is
 * discarded instead of returned: the server may still be sending rows on it, which would corrupt the next query to use it.
 */
export async function* streamRows<T = Record<string, unknown>>(sql: string, values: unknown[] = []): AsyncGenerator<T> {
  const conn = await pool.getConnection();
  let finished = false;
  try {
    // The promise wrapper's `.connection` is the underlying callback connection, which is the one that can stream (the typings say otherwise)
    const core = conn.connection as unknown as CoreConnection;
    for await (const row of core.query(sql, values).stream({ highWaterMark: 500 })) yield row as T;
    finished = true;
  } finally {
    if (finished) conn.release();
    else conn.destroy();
  }
}

/**
 * Runs `task` with the thread id of a pool connection that stays checked out (so idle) until the task finishes,
 * then returns it to the pool. Taking a connection and not releasing it permanently uses up one of the pool's slots.
 */
export async function withConnectionId<T>(task: (threadId: number) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    return await task(conn.threadId);
  } finally {
    conn.release();
  }
}
