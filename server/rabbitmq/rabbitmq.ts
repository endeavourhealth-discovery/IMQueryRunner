import { Connection } from "rabbitmq-client";
import { JobStatus } from "~~/enums";
import hash from "object-hash";
import { v4 as uuidv4 } from "uuid";
import { imapi } from "~~/server/utils/imapi";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";
import { jobTable } from "~~/server/db/postgres/schema";
import type { QueryRequest } from "~~/models/AutoGen";
import { executeQuery } from "../utils/executeQuery";
import type { Job } from "~~/models/job.schema";

const rabbit = new Connection(process.env.RABBITMQ_URL);
rabbit.on("error", (err) => {});
rabbit.on("connection", () => {});

const sub = rabbit.createConsumer(
  {
    queue: "query.execute",
    queueOptions: { durable: true },
    requeue: false,
    exchanges: [{ exchange: "query_runner", type: "topic", durable: true }],
    queueBindings: [
      {
        exchange: "query_runner",
        routingKey: "query.execute.#",
        queue: "query.execute",
      },
    ],
  },
  async (msg) => {
    const id = msg.messageId!;
    const job = await postgresDb.query.jobTable.findFirst({
      where: eq(jobTable.id, id),
    });
    if (job && JobStatus.CANCELLED === job.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!job) {
      throw new Error("Could not find job with id: " + id);
    }

    await postgresDb
      .update(jobTable)
      .set({
        status: JobStatus.RUNNING,
        startedAt: new Date().toISOString(),
      })
      .where(eq(jobTable.id, id));
    const parsedJob = JSON.parse(msg.body);
    const queryRequest: QueryRequest = parsedJob.queryRequest;
    let sql: string | undefined = await imapi
      .getQuerySql(queryRequest)
      .catch(async (err) => {
        console.error(err);
        await postgresDb
          .update(jobTable)
          .set({
            status: JobStatus.ERRORED,
            error: JSON.stringify(err),
            stoppedAt: new Date().toISOString(),
          })
          .where(eq(jobTable.id, id));
        return undefined;
      });
    if (!sql) {
      throw new Error("Could generate SQL for job with id: " + id);
    }
    const pid = await executeQuery(sql, queryRequest);
    await postgresDb
      .update(jobTable)
      .set({
        pid: pid ?? 1, // temp default to 1 TODO
        status: JobStatus.COMPLETED,
        stoppedAt: new Date().toISOString(),
      })
      .where(eq(jobTable.id, id));
  },
);

sub.on("error", (err) => {});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic", durable: true }],
});

export async function sendMessage(userId: string, message: Job) {
  await pub.send(
    {
      messageId: message.id,
      exchange: "query_runner",
      routingKey: "query.execute." + userId,
      durable: true,
    },
    JSON.stringify(message),
  );
  return message.id;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
