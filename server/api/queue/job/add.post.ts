import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { type QueryRequest } from "vue-library/interfaces";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import { v4 } from "uuid";

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id");
  const user = await globalThis.apiGuard.getUser(event);
  const queryRequest: QueryRequest = await readBody(event);
  const getQueryRequestForSQL = await imapi.getQueryRequestForSQL(
    sessionId!,
    queryRequest,
  );
  const hash = hashQueryRequest(getQueryRequestForSQL);
  try {
    await imapi.getQuerySql(sessionId!, queryRequest);
  } catch (e: unknown) {
    throw createError("Unable to convert query to SQL");
  }
  const queryTask: Job = {
    dbid: v4(),
    jobName: getQueryRequestForSQL.query.name || "Unnamed Query",
    queryRequest: queryRequest,
    queryHash: "" + hash,
    queryType: getQueryRequestForSQL.query.queryType,
    status: JobStatus.QUEUED,
    userId: user!.id,
    queueDate: new Date().toISOString(),
  } as Job;
  await postgresDb.insert(jobTable).values(pgJobInsert.parse(queryTask));
  await sendMessage(user!.id, queryTask);
  return { jobId: queryTask.dbid };
});
