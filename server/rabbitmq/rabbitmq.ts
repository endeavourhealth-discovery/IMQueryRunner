import { Connection } from "rabbitmq-client";
import { PrismaClient as PostgresPrismaClient } from "@@/prisma/generated/postgres";
import { PrismaClient as MYSQLPrismaClient } from "~~/prisma/generated/mysql";
import { QueueItemStatus } from "~~/enums";
import { QueryRequest } from "~~/models/AutoGen";
import { $fetch } from "ofetch";
import hash from "object-hash";

const postgresPrisma = new PostgresPrismaClient();
const mysqlPrisma = new MYSQLPrismaClient();

const resultsMap: Map<string, string[]> = new Map();

const rabbit = new Connection(process.env.RABBITMQ_URL);
rabbit.on("error", (err) => {
  console.log("RabbitMQ connection error", err);
});
rabbit.on("connection", () => {
  console.log("Connection successfully (re)established");
});

const sub = rabbit.createConsumer(
  {
    queue: "query.execute",
    queueOptions: { durable: true },
    exchanges: [{ exchange: "query_runner", type: "topic" }],
    queueBindings: [
      {
        exchange: "query_runner",
        routingKey: "query.execute.#",
        queue: "query.execute",
      },
    ],
  },
  async (msg) => {
    const id = msg.messageId;
    const queueItem = msg.body;
    const entry = await postgresPrisma.queueItem.findFirst({
      where: { id: { equals: id } },
    });
    if (entry && QueueItemStatus.CANCELLED === entry.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!entry) {
      throw new Error("Could not find entry with id: " + id);
    }
    await postgresPrisma.queueItem.update({
      where: { id: id },
      data: { status: QueueItemStatus.RUNNING, started_at: new Date() },
    });
    const queryRequest: QueryRequest = JSON.parse(queueItem);
    const { data, error } = await $fetch(
      process.env.IMAPI_URL! + "query/public/sql",
      {
        body: queryRequest,
        method: "get",
      }
    );
    if (data.value && typeof data.value === "string") {
      const requestHash = hash(queryRequest);
      const queryResults: string[] = await mysqlPrisma.$queryRawUnsafe(
        data.value
      );
      resultsMap.set(requestHash, queryResults);
      mysqlPrisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ${requestHash} (
          id BIGINT NOT NULL,
          PRIMARY KEY(id)
        )
      `;
      await mysqlPrisma.$queryRaw`
        INSERT INTO ${requestHash} (id) VALUES ${queryResults}
      `;
      await postgresPrisma.queueItem.update({
        where: { id: id },
        data: { status: QueueItemStatus.COMPLETED, finished_at: new Date() },
      });
    }
    if (error.value) {
      await postgresPrisma.queueItem.update({
        where: { id: id },
        data: {
          status: QueueItemStatus.ERRORED,
          error: JSON.stringify(error.value),
          killed_at: new Date(),
        },
      });
    }
  }
);

sub.on("error", (err) => {
  console.log("consumer error (query.execute)", err);
});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic" }],
});

export async function sendMessage(userId: string, message: any) {
  await pub.send(
    { exchange: "query_runner", routingKey: "query.execute." + userId },
    message
  );
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
