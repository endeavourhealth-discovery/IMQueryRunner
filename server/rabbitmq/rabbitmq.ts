import Logger from "#shared/logger";
import type { JobQueueMessage, PlannedQueryRequest } from "~~/models/jobQueueMessage.schema";

import { Connection } from "rabbitmq-client";

import { handleJobMessage } from "./jobConsumer";

const LOG = Logger("server/rabbitmq");

const rabbit = new Connection(process.env.RABBITMQ_URL);
// The client reconnects on its own; log so an outage is visible rather than silent
rabbit.on("error", (err: Error) => LOG.error({ err }, "Connection error"));
rabbit.on("connection", () => LOG.info("Connected"));

// One message at a time, in the order sent: a job's requests are sent in dependency order and each relies on the ones before it having run.
// Running a job's messages on several consumers at once would break that.
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
  handleJobMessage
);
sub.on("error", (err: Error) => {
  LOG.error({ err }, "Queue error");
});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic", durable: true }]
});

/** Sends each request of a job as its own message, in order, all carrying the job's id. Plan the job (`planJob`) first. */
export async function sendJobRequests(userId: string, jobId: number, planned: PlannedQueryRequest[]) {
  for (const [index, item] of planned.entries()) {
    const message: JobQueueMessage = { jobId, index, total: planned.length, ...item };
    await pub.send(
      {
        messageId: `${jobId}.${index}`,
        correlationId: String(jobId),
        exchange: "query_runner",
        routingKey: "query.execute." + userId,
        durable: true
      },
      message
    );
  }
  return jobId;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
