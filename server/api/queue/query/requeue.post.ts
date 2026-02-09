import { sendMessage } from "~~/server/rabbitmq/rabbitmq";
import { pgJobInsert, postgresDb } from "~~/server/db/postgres";
import { jobTable } from "~~/server/db/postgres/schema";
import { type Job } from "~~/models/job.schema";

export default defineEventHandler(async (event) => {
    const data: Job = await readBody(event);
    //const data = pgJobInsert.parse(event) as Job;
    await postgresDb.insert(jobTable).values(data);
    await sendMessage(data.userId, data);
});
