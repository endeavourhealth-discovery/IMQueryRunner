import { MySql2Database, drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";

import * as schema from "./mysql/schema";

if (!process.env.COMPASS_URL) {
  throw new Error("Missing COMPASS_URL environment variable");
}

export let connectionId: number;

const connection = mysql.createConnection(process.env.COMPASS_URL as string);
connection.connect(err => {
  if (err) throw err;
  connectionId = connection.threadId;
});

export const mysqlDb: MySql2Database<typeof schema> = drizzle({
  client: connection,
  schema,
  mode: "default"
});
