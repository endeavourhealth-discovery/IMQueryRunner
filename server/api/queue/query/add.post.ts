
import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { type QueryRequest, DatabaseOption } from "~~/models/AutoGen";
import { JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";
import { v4 } from "uuid";

export default defineEventHandler(async (event) => {
  const user = await globalThis.apiGuard.getUser();
  const queryRequest: QueryRequest = await readBody(event);

  if (!queryRequest.language) queryRequest.language = DatabaseOption.MYSQL;
  try {
    await imapi.getQuerySql(queryRequest);
  } catch (e: unknown) {
    throw createError("Unable to convert query to SQL");
  }
  const queryTask: Job = {
    id: v4(),
    jobName: queryRequest.query.name || "Unnamed Query",
    queryIri: queryRequest.query.iri,
    queryRequest: queryRequest,
    status: JobStatus.QUEUED,
    userId: user!.id,
    userName: user!.userName,
    queryResult: [],
    queuedAt: new Date().toDateString() as any,
  } as Job;
  await postgresDb.insert(jobTable).values(pgJobInsert.parse(queryTask));
  await sendMessage(user!.id, queryTask);
});
