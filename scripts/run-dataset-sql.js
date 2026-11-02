import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const sqlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../server/db/mysql/dataset.sql");

// Values from .env fill in gaps only; real environment variables take precedence
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const url = process.env.COMPASS_URL;
if (!url) {
  console.error("COMPASS_URL is not set (expected mysql://<user>:<password>@<server>/<database>)");
  process.exit(1);
}

const { hostname, port, username, password, pathname } = new URL(url);

const connection = await mysql.createConnection({
  host: hostname,
  port: port ? Number(port) : 3306,
  user: decodeURIComponent(username),
  password: decodeURIComponent(password),
  database: decodeURIComponent(pathname.replace(/^\//, "")) || undefined,
  multipleStatements: true
});

try {
  const sql = await readFile(sqlPath, "utf8");
  console.log(`Running ${sqlPath} against ${hostname}${pathname}`);
  await connection.query(sql);
  console.log("Done");
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
