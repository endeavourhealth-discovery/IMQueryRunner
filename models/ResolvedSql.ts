import { SQL } from "drizzle-orm";

export interface ResolvedSql {
  query: SQL;
  displaySql: string;
}
