import { Connection } from "rabbitmq-client";
import { JobStatus } from "~~/enums";
import { executeQuery, getValidatedSQL } from "../utils/executeQuery";
import type { Job } from "~~/models/job.schema";
import type { User } from "~~/models/User";
import { queryResultSetTable } from "../db/mysql/schema";
import {
  createResultSetEntry,
  getJobById,
  updateJobStatus,
  updateWithEndTime,
} from "../helpers/mysqlHelper";

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
    const job = await getJobById(Number(msg.messageId!));
    if (job && JobStatus.CANCELLED === job.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    await updateJobStatus(job.id, JobStatus.RUNNING);
    for (const queryRequest of job.queryRequests) {
      // TODO: check if indicator
      const sql = await getValidatedSQL(
        queryRequest,
        await getSession(),
        job.id,
      );
      const queryResultSet = await createResultSetEntry(queryRequest, job);

      try {
        await executeQuery(
          await getSession(),
          sql,
          queryRequest,
          queryResultSet,
        );
        await updateWithEndTime(queryResultSet.id!, queryResultSetTable);
      } catch (err) {
        await updateJobStatus(job.id, JobStatus.ERRORED, JSON.stringify(err));
        return;
      }
    }
    await updateJobStatus(job.id, JobStatus.COMPLETED);
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
