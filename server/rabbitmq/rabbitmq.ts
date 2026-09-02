import { ErrorCode, JobStatus } from "~~/enums";
import type { Job } from "~~/models/job.schema";

import { IMQType } from "@endeavour/vue-library/enums";
import { type QueryRequest, type User } from "@endeavour/vue-library/models";

import { Connection } from "rabbitmq-client";

import { indicatorResultTable, queryResultSetTable } from "../db/mysql/schema";
import { createIndicatorResultEntry, createResultSetEntry, getJobById, updateJobStatus, updateWithEndTime } from "../helpers/mysqlHelper";
import { executeQuery, getIndicatorSubQueryRequests, getValidatedSQL } from "../utils/executeQuery";

const rabbit = new Connection(process.env.RABBITMQ_URL);
rabbit.on("error", (err: Error) => {});
rabbit.on("connection", () => {});

let sessionId: string | undefined = undefined;
async function getSession() {
  if (!sessionId) {
    try {
      const response = await $fetch<{ sessionId: string; user: User }>("/api/auth/machineLogin", {
        query: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET
        },
        headers: {
          "X-IGNORE-IP": "true"
        }
      });
      sessionId = response.sessionId;
    } catch (err: unknown) {
      if (isError(err)) throw createError({ statusCode: 401, statusMessage: ErrorCode.AuthorisationError, message: err.message });
      else throw createError({ statusCode: 500, statusMessage: ErrorCode.InternalServerError, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  return sessionId;
}

const sub = rabbit.createConsumer(
  {
    queue: "query.execute",
    queueOptions: { durable: true },
    qos: { prefetchCount: 1 },
    concurrency: 1,
    requeue: false,
    exchanges: [{ exchange: "query_runner", type: "topic", durable: true }],
    queueBindings: [
      {
        exchange: "query_runner",
        routingKey: "query.execute.#",
        queue: "query.execute"
      }
    ]
  },
  async (msg: any) => {
    let job: Job | undefined;

    try {
      const session = await getSession();
      job = await getJobById(Number(msg.messageId!));

      if (job.status === JobStatus.CANCELLED) {
        console.warn("Item is cancelled. Query rejected.");
        return;
      }

      await updateJobStatus(job.id, JobStatus.RUNNING, job.userId);

      for (const queryRequest of job.queryRequests) {
        const sql = await getValidatedSQL(queryRequest, session, job.id);
        const queryResultSet = await createResultSetEntry(queryRequest, job);

        const queriesToRun: { sql: string; queryRequest: QueryRequest }[] = [];
        let indicatorId: number | null = null;

        if (queryRequest.query.queryType === IMQType.INDICATOR) {
          indicatorId = await createIndicatorResultEntry(queryRequest, queryResultSet, hashQueryRequest(queryRequest));

          queriesToRun.push(...(await getIndicatorSubQueryRequests(session, queryRequest, job.id)));
        } else {
          queriesToRun.push({ sql, queryRequest });
        }

        console.log("Queries to run:", queriesToRun.length);

        for (const item of queriesToRun) {
          await executeQuery(session, item.sql, item.queryRequest, queryResultSet);
        }

        await updateWithEndTime(queryResultSet.id!, queryResultSetTable);

        if (indicatorId) {
          await updateWithEndTime(indicatorId, indicatorResultTable);
        }
      }

      await updateJobStatus(job.id, JobStatus.COMPLETED, job.userId);
    } catch (err: unknown) {
      console.error("Consumer failed for message:", msg?.messageId, err);

      if (job?.id) {
        try {
          await updateJobStatus(job.id, JobStatus.ERRORED, job.userId, err);
        } catch (statusErr) {
          console.error("Failed to update job status to ERRORED:", statusErr);
        }
      }
      throw createError({ statusCode: 500, statusMessage: ErrorCode.RabbitMQConsumerError, message: "[RabbitMQ] consumer error", cause: err });
    }
  }
);
sub.on("error", (err: Error) => {
  console.error("[RabbitMQ] queue error:", { message: err.message, name: err.name, stack: err.stack });
});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic", durable: true }]
});

export async function sendMessage(userId: string, message: Job) {
  await pub.send(
    {
      messageId: "" + message.id,
      exchange: "query_runner",
      routingKey: "query.execute." + userId,
      durable: true
    },
    JSON.stringify(message)
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
