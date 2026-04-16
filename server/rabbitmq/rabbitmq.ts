import { Connection } from "rabbitmq-client";
import { JobStatus } from "~~/enums";
import { imapi } from "~~/server/utils/imapi";
import { eq } from "drizzle-orm";
import type { QueryRequest } from "~~/models/AutoGen";
import { executeQuery } from "../utils/executeQuery";
import type { Job } from "~~/models/job.schema";
import type { QueryResultSet } from "~~/models/queryResultSet.schema";
import type { User } from "~~/models/User";
import { mysqlDb } from "../db/mysql";
import { jobTable, queryResultSetTable } from "../db/mysql/schema";

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
    const jobId = Number(msg.messageId!);
    const job = await mysqlDb.query.jobTable.findFirst({
      where: eq(jobTable.id, jobId),
    });
    if (job && JobStatus.CANCELLED === job.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!job) {
      throw new Error("Could not find job with id: " + jobId);
    }
    console.log(job);
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.RUNNING,
        runDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      })
      .where(eq(jobTable.id, jobId));
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
              finishDate: new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            })
            .where(eq(jobTable.id, jobId));
          return undefined;
        });
      if (!sql) {
        throw new Error(
          "Could generate SQL for query: " +
            queryRequest?.query?.iri +
            ", for job: " +
            jobId,
        );
      }

      const queryResultSet = {
        startOfDaySnapshot: queryRequest.startOfDaySnapshot ? 1 : 0,
        persistent: queryRequest.persistent ? 1 : 0,
        useStartOfDaySnapshot: queryRequest.useStartOfDaySnapshot ? 1 : 0,
        userId: parsedJob.userId,
        startTime: new Date().toISOString().slice(0, 19).replace("T", " "),
        jobId: jobId,
        queryIri: queryRequest.query.iri,
        searchDate: queryRequest?.searchDate as any,
        achievementDate: queryRequest?.achievementDate as any,
      } as QueryResultSet;

      const result = await mysqlDb
        .insert(queryResultSetTable)
        .values(queryResultSet);
      const queryResultSetId = result?.[0]?.insertId;
      console.log(
        "Inserted query result set with ID:",
        queryResultSetId,
        "for job ID:",
        jobId,
      );

      try {
        const { id } = await executeQuery(
          await getSession(),
          sql,
          queryRequest,
          queryResultSet,
        );
        await mysqlDb
          .update(queryResultSetTable)
          .set({
            // pid: insertId,
            endTime: new Date().toISOString().slice(0, 19).replace("T", " "),
          })
          .where(eq(queryResultSetTable.id, queryResultSetId));
      } catch (err) {
        //   await mysqlDb
        //     .update(jobTable)
        //     .set({
        //       status: JobStatus.ERRORED,
        //       error: JSON.stringify(err),
        //       finishDate: now,
        //     })
        //     .where(eq(jobTable.id, jobId));
        // }
      }
    }
    await mysqlDb
      .update(jobTable)
      .set({
        status: JobStatus.COMPLETED,
        finishDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      })
      .where(eq(jobTable.id, jobId));
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
      messageId: "" + message.id,
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
