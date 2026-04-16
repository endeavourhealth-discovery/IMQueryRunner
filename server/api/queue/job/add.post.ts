import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { jobTable } from "~~/server/db/mysql/schema";
import { mysqlDb } from "~~/server/db/mysql";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import type { JobRequest } from "~~/models/JobRequest";

import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  const user = await globalThis.apiGuard.getUser(event);
  const jobRequest: JobRequest = await readBody(event);
  console.log(
    "Received job request with tasks:",
    jobRequest?.queryRequests?.length,
  );
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
  queryJob.id = result[0].insertId;
  try {
    await sendMessage(user!.id, queryJob);
  } catch (err) {
    console.error("Failed to queue job for execution:", err);
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.ERRORED,
        finishDate: now,
        error: JSON.stringify(err),
      })
      .where(eq(jobTable.id, queryJob.id));
  }
  console.log("Job queued with ID:", queryJob.id);
  return { jobId: queryJob.id };
});
