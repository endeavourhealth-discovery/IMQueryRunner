import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { type Job } from "~~/models/job.schema";
import { v4 } from "uuid";
import { JobStatus } from "~~/enums";

export default defineEventHandler(async (event) => {
  const data: Job = await readBody(event);
  data.dbid = v4();
  data.status = JobStatus.QUEUED;
  data.queueDate = new Date().toISOString();
  delete data.finishDate;

  await postgresDb.insert(jobTable).values(data);
  await sendMessage(data.userId, data);
});
