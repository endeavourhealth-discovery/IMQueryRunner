import { Connection } from "rabbitmq-client";
import { JobStatus } from "~~/enums";
import { imapi } from "~~/server/utils/imapi";
import { eq } from "drizzle-orm";
import type { QueryRequest } from "~~/models/AutoGen";
import { executeQuery } from "../utils/executeQuery";
import type { Job } from "~~/models/job.schema";
import type { User } from "~~/models/User";
import { mysqlDb } from "../db/mysql";
import { jobTable } from "../db/mysql/schema";

const rabbit = new Connection(process.env.RABBITMQ_URL);
rabbit.on("error", (err) => {});
rabbit.on("connection", () => {});

let sessionId: string | undefined = undefined;
async function getSession() {
  if (!sessionId) {
    const response = await $fetch<{ sessionId: string; user: User }>(
      "/api/auth/machineLogin",
      {
        query: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
        },
        headers: {
          "X-IGNORE-IP": "true",
        },
      },
    );
    sessionId = response.sessionId;
  }
  return sessionId;
}

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
    const job = await mysqlDb.query.jobTable.findFirst({
      where: eq(jobTable.id, Number(id)),
    });
    if (job && JobStatus.CANCELLED === job.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!job) {
      throw new Error("Could not find job with id: " + id);
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.RUNNING,
        runDate: now,
      })
      .where(eq(jobTable.id, Number(id)));
    const parsedJob: Job = JSON.parse(msg.body);
    for (const queryRequest of parsedJob.queryRequests) {
      let sql: string | undefined = await imapi
        .getQuerySql(await getSession(), queryRequest)
        .catch(async (err) => {
          console.error(err);
          await mysqlDb
            .update(jobTable)
            .set({
              status: JobStatus.ERRORED,
              error: JSON.stringify(err),
              finishDate: now,
            })
            .where(eq(jobTable.id, Number(id)));
          return undefined;
        });
      if (!sql) {
        throw new Error(
          "Could generate SQL for query: " +
            queryRequest?.query?.iri +
            ", for job: " +
            id,
        );
      }
    }

    //   try {
    //     const { insertId, hashCode } = await executeQuery(
    //       await getSession(),
    //       sql,
    //       queryRequest,
    //     );
    //     await mysqlDb
    //       .update(jobTable)
    //       .set({
    //         // pid: insertId,
    //         status: JobStatus.COMPLETED,
    //         finishDate: now,
    //       })
    //       .where(eq(jobTable.dbid, Number(id)));
    //   } catch (err) {
    //     await mysqlDb
    //       .update(jobTable)
    //       .set({
    //         status: JobStatus.ERRORED,
    //         error: JSON.stringify(err),
    //         finishDate: now,
    //       })
    //       .where(eq(jobTable.dbid, Number(id)));
    //   }
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
      messageId: "" + message.dbid,
      exchange: "query_runner",
      routingKey: "query.execute." + userId,
      durable: true,
    },
    JSON.stringify(message),
  );
  return message.dbid;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
