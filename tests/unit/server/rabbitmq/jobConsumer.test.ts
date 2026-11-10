import { JobStatus } from "~~/enums";
import { handleJobMessage } from "~~/server/rabbitmq/jobConsumer";
import { hashQueryRequest } from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { MySqlDialect } from "drizzle-orm/mysql-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * An in-memory stand-in for the job's tables, so the real executeQuery runs against it: what one message runs is what a later
 * message of the same job finds, exactly as it would in the database.
 */
const store = vi.hoisted(() => ({
  jobs: new Map<number, any>(),
  resultSets: [] as { id: number; jobId: number; endTime: Date | null }[],
  results: [] as { id: number; resultSetId: number; jobId: number; hash: number; iri: string; status: string }[],
  executed: [] as string[],
  statuses: [] as string[],
  nextId: 1
}));
const queryService = vi.hoisted(() => ({ getSubqueryIris: vi.fn(), getQueryRequestForSQL: vi.fn(), getQuerySql: vi.fn(), getQuerySqlDebug: vi.fn() }));

const dialect = new MySqlDialect();

vi.mock("~~/server/db/mysql", () => {
  // getQueryResultIfExists(resultSetId, hash, iri) and getQueryResultIfExistsInJob(jobId, hash, iri) select through here
  const select = () => {
    let where: any;
    const chain: any = {
      from: () => chain,
      innerJoin: () => chain,
      where: (condition: any) => ((where = condition), chain),
      limit: () => chain,
      then: (res: any, rej: any) => {
        const { sql, params } = dialect.sqlToQuery(where);
        const [scopeId, hash, iri] = params as [number, number, string];
        const inJob = sql.includes("`job_id`");
        const rows = store.results.filter(r => (inJob ? r.jobId : r.resultSetId) === scopeId && r.hash === hash && r.iri === iri);
        return Promise.resolve(rows.slice(0, 1).map(r => ({ id: r.id, status: r.status }))).then(res, rej);
      }
    };
    return chain;
  };
  return {
    mysqlDb: {
      select,
      execute: async (query: any) => {
        store.executed.push(dialect.sqlToQuery(query).sql);
      },
      delete: () => ({ where: () => Promise.resolve() })
    }
  };
});

vi.mock("~~/server/helpers/mysqlHelper", () => {
  const addResult = (queryRequest: any, resultSet: any, hash: number) => {
    const id = store.nextId++;
    store.results.push({ id, resultSetId: resultSet.id, jobId: resultSet.jobId, hash, iri: queryRequest.query.iri, status: "QUEUED" });
    return id;
  };
  const setStatus = (id: number, status: string) => {
    store.results.find(r => r.id === id)!.status = status;
  };
  return {
    findJobById: async (id: number) => store.jobs.get(id),
    planJob: async (job: any) =>
      job.queryRequests.map((queryRequest: any) => {
        const resultSet = { id: store.nextId++, jobId: job.id, endTime: null };
        store.resultSets.push(resultSet);
        addResult(queryRequest, resultSet, hashQueryRequest(queryRequest));
        return { queryRequest, queryResultSetId: resultSet.id, indicatorResultId: null };
      }),
    getResultSetForJob: async (id: number, job: any) => ({ ...store.resultSets.find(s => s.id === id && s.jobId === job.id)!, userId: job.userId }),
    hasOpenResultSets: async (jobId: number) => store.resultSets.some(s => s.jobId === jobId && !s.endTime),
    updateJobStatus: async (id: number, status: string) => {
      store.jobs.get(id).status = status;
      store.statuses.push(`${id} ${status}`);
    },
    closeOpenQueryResults: vi.fn(async (jobId: number) => {
      for (const r of store.results.filter(r => r.jobId === jobId)) {
        if (r.status === "RUNNING") r.status = "ERRORED";
        if (r.status === "QUEUED") r.status = "CANCELLED";
      }
    }),
    updateWithStartTime: async () => {},
    updateWithEndTime: async (id: number) => {
      const set = store.resultSets.find(s => s.id === id);
      if (set) set.endTime = new Date();
    },
    createQueryResultEntry: async (queryRequest: any, resultSet: any, hash: number) => addResult(queryRequest, resultSet, hash),
    createQueryDependencies: async () => {},
    linkQueryResultsToIndicator: async () => {},
    markQueryResultRunning: async (id: number) => setStatus(id, "RUNNING"),
    markQueryResultCompleted: async (id: number) => setStatus(id, "COMPLETED"),
    updateWithSQL: async () => {},
    getToday: () => "2026-01-01"
  };
});
vi.mock("~~/server/services/QueryService", () => ({ default: queryService }));
vi.mock("~~/server/utils/machineToken", () => ({ getMachineAccessToken: async () => "token" }));

vi.stubGlobal("createError", (opts: { message?: string; cause?: unknown }) => Object.assign(new Error(opts.message), { cause: opts.cause }));

const Q1 = "http://example.org/q1";
const Q2 = "http://example.org/q2";
const Q3 = "http://example.org/q3";

const request = (iri: string) => ({ query: { iri, queryType: IMQType.COHORT }, argument: [{ parameter: "$searchDate", valueData: "2026-01-01" }] }) as any;

let nextJobId = 1;

/** Queues a job the way the add endpoint does: plan it, then one message per request. */
async function queueJob(...iris: string[]) {
  const { planJob } = await import("~~/server/helpers/mysqlHelper");
  const job = { id: nextJobId++, userId: "user", status: JobStatus.QUEUED, queryRequests: iris.map(request) };
  store.jobs.set(job.id, job);
  const planned = await planJob(job as any);
  const messages = planned.map((item, index) => ({ body: { jobId: job.id, index, total: planned.length, ...item }, messageId: `${job.id}.${index}` }));
  return { job, messages };
}

async function runAll(messages: { body: unknown; messageId?: string }[]) {
  for (const message of messages) await handleJobMessage(message);
}

describe("handleJobMessage", () => {
  beforeEach(() => {
    store.jobs.clear();
    store.resultSets.length = 0;
    store.results.length = 0;
    store.executed.length = 0;
    store.statuses.length = 0;
    // Q2 uses Q1; Q3 also uses Q1; Q1 uses nothing
    queryService.getSubqueryIris.mockReset().mockImplementation(async (_t: string, iri: string) => (iri === Q1 ? [] : [{ iri: Q1, parentIris: [iri] }]));
    queryService.getQueryRequestForSQL.mockReset().mockImplementation(async (_t: string, r: any) => request(r.query.iri));
    // Marker text rather than the iri: the iri inside generated SQL is swapped for a result id
    queryService.getQuerySql.mockReset().mockImplementation(async (_t: string, r: any) => `SELECT from_${r.query.iri.split("/").pop()}`);
  });

  it("runs a query once per job when one request is a sub query of another, each request in its own message", async () => {
    const { messages } = await queueJob(Q1, Q2);
    expect(messages).toHaveLength(2);

    await runAll(messages);

    expect(store.executed).toEqual(["SELECT from_q1", "SELECT from_q2"]);
  });

  it("runs the sub query again in a separate job, which does not share the first job's results", async () => {
    await runAll((await queueJob(Q1)).messages);
    await runAll((await queueJob(Q2)).messages);

    expect(store.executed).toEqual(["SELECT from_q1", "SELECT from_q1", "SELECT from_q2"]);
  });

  it("still runs the shared query once when the request that uses it is sent first", async () => {
    await runAll((await queueJob(Q2, Q1)).messages);

    expect(store.executed).toEqual(["SELECT from_q1", "SELECT from_q2"]);
    expect(store.results.every(r => r.status === JobStatus.COMPLETED)).toBe(true);
  });

  it("marks the job running on its first message and completed only after its last", async () => {
    const { job, messages } = await queueJob(Q1, Q2);

    await handleJobMessage(messages[0]!);
    expect(store.statuses).toEqual([`${job.id} RUNNING`]);

    await handleJobMessage(messages[1]!);
    expect(store.statuses).toEqual([`${job.id} RUNNING`, `${job.id} COMPLETED`]);
  });

  it("shares IMAPI lookups between the messages of a job, but not with the next job", async () => {
    await runAll((await queueJob(Q2, Q3)).messages);
    // Q1 is a sub query of both requests: looked up for the first message and reused by the second
    expect(queryService.getQueryRequestForSQL.mock.calls.filter(([, r]) => r.query.iri === Q1)).toHaveLength(1);

    await runAll((await queueJob(Q2)).messages);
    expect(queryService.getQueryRequestForSQL.mock.calls.filter(([, r]) => r.query.iri === Q1)).toHaveLength(2);
  });

  it("fails the job, cancels what has not run, and skips the job's remaining messages", async () => {
    const { job, messages } = await queueJob(Q1, Q3);
    queryService.getQuerySql.mockRejectedValueOnce(new Error("IMAPI down"));

    await expect(handleJobMessage(messages[0]!)).rejects.toThrow("[RabbitMQ] consumer error");
    expect(job.status).toBe(JobStatus.ERRORED);

    await handleJobMessage(messages[1]!);
    expect(store.executed).toEqual([]);
    expect(store.results.map(r => r.status)).toEqual([JobStatus.CANCELLED, JobStatus.CANCELLED]);
  });

  it("skips the remaining messages of a job cancelled between its requests and shows them as cancelled", async () => {
    const { job, messages } = await queueJob(Q1, Q2);
    await handleJobMessage(messages[0]!);
    job.status = JobStatus.CANCELLED;

    await handleJobMessage(messages[1]!);

    expect(store.executed).toEqual(["SELECT from_q1"]);
    expect(store.results.map(r => r.status)).toEqual([JobStatus.COMPLETED, JobStatus.CANCELLED]);
  });

  it("drops a message whose job has been deleted", async () => {
    await expect(
      handleJobMessage({ body: { jobId: 999, index: 0, total: 1, queryResultSetId: 1, indicatorResultId: null, queryRequest: request(Q1) } })
    ).resolves.toBeUndefined();
    expect(store.executed).toEqual([]);
  });

  it("runs a whole job sent the old way, as one JSON message keyed by the job id", async () => {
    const job = { id: nextJobId++, userId: "user", status: JobStatus.QUEUED, queryRequests: [request(Q1), request(Q2)] };
    store.jobs.set(job.id, job);

    await handleJobMessage({ body: JSON.stringify(job), messageId: String(job.id) });

    expect(store.executed).toEqual(["SELECT from_q1", "SELECT from_q2"]);
    expect(job.status).toBe(JobStatus.COMPLETED);
  });
});
