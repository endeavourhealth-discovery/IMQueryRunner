import {Connection} from "rabbitmq-client";
import {QueueItemStatus} from "~~/enums";
import {QueryRequest} from "~~/models/AutoGen";
import hash from "object-hash";
import {v4 as uuidv4} from "uuid";
import {imapi} from "~~/server/utils/imapi";
import {postgresDb} from "~~/server/db/postgres";
import {eq} from "drizzle-orm";
import {mysqlDb} from "~~/server/db/mysql";
import {queueItem} from "~~/server/db/postgres/schema";

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
    queueOptions: {durable: true},
    requeue: false,
    exchanges: [{exchange: "query_runner", type: "topic"}],
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
    const entry = await postgresDb.query.queueItem.findFirst({
      where: eq(queueItem.id, id),
    });
    if (entry && QueueItemStatus.CANCELLED === entry.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!entry) {
      throw new Error("Could not find entry with id: " + id);
    }

    await postgresDb
      .update(queueItem)
      .set({status: QueueItemStatus.RUNNING, startedAt: new Date().toISOString()})
      .where(eq(queueItem.id, id));

    const queryRequest: QueryRequest = JSON.parse(msg.body);

    let sql: string = await imapi.getQuerySql(queryRequest)
      .catch(async (err) => {
        console.log("IMAPI call failed");
        console.log(err);
        await postgresDb
          .update(queueItem)
          .set({
            status: QueueItemStatus.ERRORED,
            error: JSON.stringify(err),
            killedAt: new Date().toISOString(),
          })
          .where(eq(queueItem.id, id));
        });

    if (sql) {
      const requestHash = hash(queryRequest);

      console.log(`Executing SQL and caching results [${requestHash}]`);

      sql = sql.replaceAll("$searchDate", '"' + queryRequest.referenceDate! + '"');

      await mysqlDb.execute("DROP TABLE IF EXISTS imqcache.`" + requestHash + "`");

      try {
        await mysqlDb.execute("CREATE TABLE imqcache.`" + requestHash + "` AS " + sql);

        console.log("Updating queue item to `COMPLETED` status " + id);
        await postgresDb
          .update(queueItem)
          .set({
            status: QueueItemStatus.COMPLETED,
            finishedAt: new Date().toISOString(),
          })
          .where(eq(queueItem.id, id));
      } catch (err) {
        console.log("Error running query or caching results");
        console.log(sql);
        throw err;
      }
    } else {
      console.log("SQL is null or not a string");
      console.log(sql);
    }

    console.log("Done");
  }
);

sub.on("error", (err) => {
  console.log("consumer error (query.execute)", err);
});

const pub = rabbit.createPublisher({
  confirm: true,
  maxAttempts: 2,
  exchanges: [{exchange: "query_runner", type: "topic"}],
});

export async function sendMessage(userId: string, message: any) {
  const id = uuidv4();

  if (message instanceof Object)
    message = JSON.stringify(message);

  await pub.send(
    {messageId: id, exchange: "query_runner", routingKey: "query.execute." + userId},
    message
  );

  return id;
}

export function getCachedResults(requestHash: string) {
  // This needs to pull from DB!
  return null;
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
