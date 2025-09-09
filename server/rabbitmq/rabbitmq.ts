import {Connection} from "rabbitmq-client";
import {PrismaClient as PostgresPrismaClient} from "@@/prisma/generated/postgres";
import {PrismaClient as MYSQLPrismaClient} from "~~/prisma/generated/mysql";
import {QueueItemStatus} from "~~/enums";
import {QueryRequest} from "~~/models/AutoGen";
import {$fetch} from "ofetch";
import hash from "object-hash";
import {v4 as uuidv4} from "uuid";
import {imapi} from "~~/server/utils/imapi";

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
    queueOptions: {durable: true},
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
    console.log("Received message from queue");
    const id = msg.messageId;
    const queueItem = msg.body;
    const entry = await postgresPrisma.queueItem.findFirst({
      where: {id: {equals: id}},
    });
    if (entry && QueueItemStatus.CANCELLED === entry.status) {
      throw new Error("Item is cancelled. Query rejected.");
    }
    if (!entry) {
      throw new Error("Could not find entry with id: " + id);
    }

    console.log("Updating queue item to `RUNNING` status " + id);
    await postgresPrisma.queueItem.update({
      where: {id: id},
      data: {status: QueueItemStatus.RUNNING, started_at: new Date()},
    });

    console.log("Parsing request");
    const queryRequest: QueryRequest = queueItem;

    console.log("Getting SQL from IMAPI");
    let sql: string = await imapi.getQuerySql(queryRequest)
      .catch(async (err) => {
        console.log("IMAPI call failed");
        console.log(err);
        await postgresPrisma.queueItem.update({
          where: {id: id},
          data: {
            status: QueueItemStatus.ERRORED,
            error: JSON.stringify(err),
            killed_at: new Date(),
          },
        });
      });

    sql = sql.replaceAll("$searchDate", '"' + queryRequest.referenceDate! + '"');

    console.log("Executing SQL and caching results");
    console.log(sql);
    if (sql && typeof sql === "string") {
      const requestHash = hash(queryRequest);
      sql = 'INSERT INTO imqcache.' + requestHash + ' ' + sql;
      try {
        const queryResults: string[] = await mysqlPrisma.$queryRawUnsafe(sql);
        resultsMap.set(requestHash, queryResults);
        console.log("Creating result table " + requestHash)
        mysqlPrisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS ${requestHash}
            (
                id
                BIGINT
                NOT
                NULL,
                PRIMARY
                KEY
            (
                id
            )
                )
        `;

        if (queryResults.length === 0) {
          console.log("No results to insert");
        } else {
          console.log("Inserting " + queryResults?.length + " results into table " + requestHash)
          await mysqlPrisma.$queryRaw`
              INSERT INTO ${requestHash} (id)
              VALUES ${queryResults}
          `;
          console.log("Done inserting");
        }

        console.log("Updating queue item to `COMPLETED` status " + id);
        await postgresPrisma.queueItem.update({
          where: {id: id},
          data: {status: QueueItemStatus.COMPLETED, finished_at: new Date()},
        });
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

  await pub.send(
    {messageId: id, exchange: "query_runner", routingKey: "query.execute." + userId},
    message
  );

  return id;
}

export function getCachedResults(requestHash: string) {
  if (resultsMap.has(requestHash)) return resultsMap.get(requestHash);
}

async function onShutdown() {
  await pub.close();
  await sub.close();
  await rabbit.close();
}

process.on("SIGINT", onShutdown);
process.on("SIGTERM", onShutdown);
