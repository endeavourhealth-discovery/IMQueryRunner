import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./postgres/schema"

export const postgresDb = drizzle(process.env.POSTGRES_URL!, { schema });
