import {JobStatus} from "~~/enums";
import {z} from "zod";
import {postgresDb} from "~~/server/db/postgres";
import {eq} from "drizzle-orm";
import {jobTable} from "~~/server/db/postgres/schema";
import {createPool, type RowDataPacket} from "mysql2/promise";

const paramSchema = z.object({
  jobId: z.string(),
});

interface ProcessRow extends RowDataPacket {
  Id: number;
  User: string;
  Host: string;
  db: string | null;
  Command: string;
  Time: number;
  State: string | null;
  Info: string | null;
}

export default defineEventHandler(async (event) => {
  const {jobId} = await getValidatedRouterParams(event, paramSchema.parse);
  const item = await postgresDb.query.jobTable.findFirst({
    where: eq(jobTable.dbid, jobId),
  });
  if (item?.status === JobStatus.QUEUED) {
    await postgresDb
        .update(jobTable)
        .set({
          status: JobStatus.CANCELLED,
          finishDate: new Date().toISOString(),
        })
        .where(eq(jobTable.dbid, item.dbid));
  } else if (item?.status === JobStatus.RUNNING) {
    const pool = createPool(process.env.COMPASS_URL!);
    const [rows] = await pool.query<ProcessRow[]>("SHOW FULL PROCESSLIST");
    for (const process of rows) {
      if (process.Command === "Query"
          //TODO: && FIND CORRECT PROCESS ID USING JOB ID
      ) {
        await pool.query("KILL QUERY ?", [process.Id]);
      }
    }
    const activeQuery = postgresDb.execute(`
        SELECT *
        FROM pg_stat_activity
        WHERE state = 'active' LIMIT 1
    `);
    const result = postgresDb.execute(`
      SELECT pg_cancel_backend(${activeQuery})
      `);
    if (!result) {
      postgresDb.execute(`
        SELECT pg_terminate_backend(${activeQuery})
        `);
    }
    await postgresDb
        .update(jobTable)
        .set({
          status: JobStatus.KILLED,
          finishDate: new Date().toISOString(),
        })
        .where(eq(jobTable.dbid, item.dbid));
  } else {
    createError("Query queue item not found for id: " + jobId);
  }
});
