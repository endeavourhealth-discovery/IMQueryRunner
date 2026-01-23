import { Connection } from "rabbitmq-client";
import { QueueItemStatus } from "~~/enums";
import hash from "object-hash";
import { v4 as uuidv4 } from "uuid";
import { imapi } from "~~/server/utils/imapi";
import { postgresDb } from "~~/server/db/postgres";
import { eq } from "drizzle-orm";
import { mysqlDb } from "~~/server/db/mysql";
import { queryQueue } from "~~/server/db/postgres/schema";
import type { QueryRequest } from "~~/models/AutoGen";
import { executeQuery } from "../utils/executeQuery";

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
    const entry = await postgresDb.query.queryQueue.findFirst({
      where: eq(queryQueue.id, id),
    });
    if (entry && QueueItemStatus.CANCELLED === entry.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!entry) {
      throw new Error("Could not find entry with id: " + id);
    }

    await postgresDb
      .update(queryQueue)
      .set({
        status: QueueItemStatus.RUNNING,
        startedAt: new Date().toISOString(),
      })
      .where(eq(queryQueue.id, id));

    const queryRequest: QueryRequest = JSON.parse(msg.body);

    let sql: string | undefined = await imapi
      .getQuerySql(queryRequest)
      .catch(async (err) => {
        console.error(err);
        await postgresDb
          .update(queryQueue)
          .set({
            status: QueueItemStatus.ERRORED,
            error: JSON.stringify(err),
            killedAt: new Date().toISOString(),
          })
          .where(eq(queryQueue.id, id));
        return undefined;
      });

    if (sql) {
      await executeQuery(sql, queryRequest, id);
    }
  }
);

sub.on("error", (err) => {});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{ exchange: "query_runner", type: "topic", durable: true }],
});

export async function sendMessage(userId: string, message: any) {
  const id = uuidv4();

  if (message instanceof Object) message = JSON.stringify(message);

  await pub.send(
    {
      messageId: id,
      exchange: "query_runner",
      routingKey: "query.execute." + userId,
      durable: true,
    },
    message
  );

  return id;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
