import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { jobTable } from "~~/server/db/mysql/schema";
import { mysqlDb } from "~~/server/db/mysql";
import { type QueryRequest } from "~~/models/AutoGen";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  const user = await globalThis.apiGuard.getUser(event);
  const jobRequest: {
    jobName: string;
    queryRequests: QueryRequest[];
    startOfDaySnapshot: boolean;
    persistent: boolean;
    useStartOfDaySnapshot: boolean;
  } = await readBody(event);
  const queryRequestsForSql = [];
  for (const queryRequest of jobRequest.queryRequests) {
    const getQueryRequestForSQL = await imapi.getQueryRequestForSQL(
      sessionId!,
      queryRequest,
    );
    queryRequestsForSql.push(getQueryRequestForSQL);
  }
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const queryJob = {
    jobName: jobRequest.jobName || "Unnamed Job",
    queryRequests: queryRequestsForSql,
    startOfDaySnapshot: jobRequest.startOfDaySnapshot ? 1 : 0,
    persistent: jobRequest.persistent ? 1 : 0,
    useStartOfDaySnapshot: jobRequest.useStartOfDaySnapshot ? 1 : 0,
    userId: user!.id,
    queueDate: now,
    status: JobStatus.QUEUED,
    error: null,
  } as Job;

  const result = await mysqlDb.insert(jobTable).values(queryJob);
  if (!result?.[0]?.insertId)
    throw new Error("Failed to insert job into database");
  queryJob.dbid = result[0].insertId;
  try {
    await sendMessage(user!.id, queryJob);
  } catch (err) {
    console.error("Failed to send message to RabbitMQ:", err);
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.ERRORED,
        finishDate: now,
        error: JSON.stringify(err),
      })
      .where(eq(jobTable.id, queryJob.dbid));
    throw new Error("Failed to queue job for execution");
  }
  return { jobId: queryJob.dbid };
});
