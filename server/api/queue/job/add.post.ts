import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { jobTable } from "~~/server/db/mysql/schema";
import { mysqlDb } from "~~/server/db/mysql";
import { type QueryRequest } from "~~/models/AutoGen";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";

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
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const queryTask = {
    jobName: getQueryRequestForSQL.query.name || "Unnamed Query",
    queryIri: getQueryRequestForSQL.query.iri!,
    queryDefinition: getQueryRequestForSQL,
    queryType: getQueryRequestForSQL.query.queryType,
    searchDate: queryRequest.argument?.find(
      (arg) => arg.parameter === "searchDate",
    )?.valueData as string | undefined,
    achievementDate: queryRequest.argument?.find(
      (arg) => arg.parameter === "achievementDate",
    )?.valueData as string | undefined,
    hash: hash,
    userId: user!.id,
    queueDate: now,
    status: JobStatus.QUEUED,
    error: null,
  } as Job;

  const result = await mysqlDb.insert(jobTable).values(queryTask);
  queryTask.dbid = result[0].insertId;
  await sendMessage(user!.id, queryTask);
  return { jobId: queryTask.dbid };
});
