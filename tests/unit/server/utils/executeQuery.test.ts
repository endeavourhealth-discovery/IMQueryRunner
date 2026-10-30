import { JobStatus } from "~~/enums";
import {
  createExecutionContext,
  executeDatasetQuery,
  executeQuery,
  getIndicatorSubQueryRequests,
  hashQueryRequest,
  linkIndicatorSubQueries,
  prepareIndicatorSubQueries
} from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ order: [] as string[], existing: [] as { id: number; status: string }[][] }));
const queryService = vi.hoisted(() => ({
  getSubqueryIris: vi.fn(),
  getQueryRequestForSQL: vi.fn(),
  getQuerySql: vi.fn(),
  getQuerySqlDebug: vi.fn()
}));
const helper = vi.hoisted(() => ({
  createQueryDependencies: vi.fn(),
  createQueryResultEntry: vi.fn(),
  linkQueryResultsToIndicator: vi.fn(),
  markQueryResultCompleted: vi.fn(),
  markQueryResultRunning: vi.fn(),
  getToday: vi.fn(() => "2026-01-01"),
  updateWithEndTime: vi.fn(),
  updateWithSQL: vi.fn()
}));
const db = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("~~/server/db/mysql", () => {
  // Any select().from()...where().limit() resolves to the next queued rows, or "no rows", i.e. nothing cached yet
  const chain: any = new Proxy(
    {},
    { get: (_, prop) => (prop === "then" ? (res: any, rej: any) => Promise.resolve(calls.existing.shift() ?? []).then(res, rej) : () => chain) }
  );
  return { mysqlDb: { select: () => chain, execute: db.execute, delete: () => ({ where: () => Promise.resolve() }) } };
});
vi.mock("~~/server/services/QueryService", () => ({ default: queryService }));
vi.mock("~~/server/helpers/mysqlHelper", () => helper);

const SUB_A = "http://example.org/subA";
const SUB_B = "http://example.org/subB";

const request = (iri: string) => ({ query: { iri, queryType: IMQType.COHORT }, argument: [{ parameter: "$searchDate", valueData: "2026-01-01" }] }) as any;
const resultSet = { id: 1, jobId: 7 } as any;

describe("executeQuery per-job lookups", () => {
  beforeEach(() => {
    calls.order.length = 0;
    calls.existing.length = 0;
    let nextId = 100;
    helper.markQueryResultRunning.mockReset().mockImplementation(async (id: number) => {
      calls.order.push(`running ${id}`);
    });
    helper.markQueryResultCompleted.mockReset().mockImplementation(async (id: number) => {
      calls.order.push(`completed ${id}`);
    });
    helper.createQueryResultEntry.mockReset().mockImplementation(async () => nextId++);
    helper.createQueryDependencies.mockReset().mockResolvedValue(undefined);
    helper.updateWithEndTime.mockReset().mockResolvedValue(undefined);
    helper.updateWithSQL.mockReset().mockResolvedValue(undefined);
    db.execute.mockReset().mockImplementation(async () => {
      calls.order.push("execute");
    });
    queryService.getSubqueryIris.mockReset().mockResolvedValue([{ iri: SUB_A }, { iri: SUB_B }]);
    queryService.getQueryRequestForSQL.mockReset().mockImplementation(async (_t: string, r: any) => request(r.query.iri));
    queryService.getQuerySql.mockReset().mockImplementation(async (_t: string, r: any) => `SELECT '${r.query.iri}'`);
  });

  it("looks up each shared sub query once per job, however many requests use it", async () => {
    const ctx = createExecutionContext();
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, ctx);
    await executeQuery("token", "SELECT 2", request("http://example.org/q2"), resultSet, ctx);

    // Two requests that share two sub queries: each parent lists its sub queries, but each sub query is fetched once (not twice)
    expect(queryService.getSubqueryIris).toHaveBeenCalledTimes(2);
    expect(queryService.getQueryRequestForSQL).toHaveBeenCalledTimes(2);
    expect(queryService.getQuerySql).toHaveBeenCalledTimes(2);
  });

  it("does not remember anything between jobs", async () => {
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, createExecutionContext());
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, createExecutionContext());

    expect(queryService.getQueryRequestForSQL).toHaveBeenCalledTimes(4);
    expect(queryService.getQuerySql).toHaveBeenCalledTimes(4);
  });

  it("fetches the sub query definitions together but still runs them in order, before the main query", async () => {
    let inFlight = 0;
    let peak = 0;
    queryService.getQueryRequestForSQL.mockImplementation(async (_t: string, r: any) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      inFlight--;
      return request(r.query.iri);
    });
    // Marker text rather than the iri: the iri inside generated SQL is swapped for a result id
    queryService.getQuerySql.mockImplementation(async (_t: string, r: any) => `SELECT from_${r.query.iri.split("/").pop()}`);
    const executed: string[] = [];
    db.execute.mockImplementation(async (query: any) => {
      executed.push(JSON.stringify(query));
    });

    await executeQuery("token", "SELECT main", request("http://example.org/q1"), resultSet, createExecutionContext());

    expect(peak).toBe(2);
    expect(executed).toHaveLength(3);
    expect(executed[0]).toContain("from_subA");
    expect(executed[1]).toContain("from_subB");
    expect(executed[2]).toContain("SELECT main");
  });

  it("records each sub query's parents by result id, including parents listed after it", async () => {
    const MAIN = "http://example.org/q1";
    // subA is used by subB (listed after it) and by the main query; subB only by the main query
    queryService.getSubqueryIris.mockResolvedValue([
      { iri: SUB_A, parentIris: [SUB_B, MAIN] },
      { iri: SUB_B, parentIris: [MAIN] }
    ]);

    // Result ids: main 100, subA 101, subB 102
    await executeQuery("token", "SELECT 1", request(MAIN), resultSet, createExecutionContext());

    expect(helper.createQueryDependencies).toHaveBeenCalledWith([
      { parentQueryResultId: 102, subQueryResultId: 101 },
      { parentQueryResultId: 100, subQueryResultId: 101 },
      { parentQueryResultId: 100, subQueryResultId: 102 }
    ]);
  });

  it("creates every sub query's result and link before running any, then moves each one through its statuses in order", async () => {
    const MAIN = "http://example.org/q1";
    queryService.getSubqueryIris.mockResolvedValue([
      { iri: SUB_A, parentIris: [MAIN] },
      { iri: SUB_B, parentIris: [MAIN] }
    ]);
    helper.createQueryResultEntry.mockImplementation(async (r: any) => {
      calls.order.push(`create ${r.query.iri}`);
      return r.query.iri === SUB_A ? 101 : r.query.iri === SUB_B ? 102 : 100;
    });
    helper.createQueryDependencies.mockImplementation(async () => {
      calls.order.push("link");
    });

    await executeQuery("token", "SELECT 1", request(MAIN), resultSet, createExecutionContext());

    expect(calls.order).toEqual([
      `create ${MAIN}`,
      "running 100",
      `create ${SUB_A}`,
      `create ${SUB_B}`,
      "link",
      "running 101",
      "execute",
      "completed 101",
      "running 102",
      "execute",
      "completed 102",
      "execute",
      "completed 100"
    ]);
  });

  it("leaves the sub queries after a failure unrun, already recorded under their parent", async () => {
    const MAIN = "http://example.org/q1";
    queryService.getSubqueryIris.mockResolvedValue([
      { iri: SUB_A, parentIris: [MAIN] },
      { iri: SUB_B, parentIris: [MAIN] }
    ]);
    db.execute.mockRejectedValueOnce(new Error("bad sql"));

    await expect(executeQuery("token", "SELECT 1", request(MAIN), resultSet, createExecutionContext())).rejects.toThrow("bad sql");

    // Result ids: main 100, subA 101, subB 102
    expect(helper.createQueryDependencies).toHaveBeenCalledWith([
      { parentQueryResultId: 100, subQueryResultId: 101 },
      { parentQueryResultId: 100, subQueryResultId: 102 }
    ]);
    expect(helper.markQueryResultRunning.mock.calls.map(call => call[0])).toEqual([100, 101]);
    expect(helper.markQueryResultCompleted).not.toHaveBeenCalled();
  });

  it("only resolves a sub query's SQL against the results that ran before it", async () => {
    const MAIN = "http://example.org/q1";
    queryService.getSubqueryIris.mockResolvedValue([{ iri: SUB_A }, { iri: SUB_B }]);
    // subA's SQL mentions subB, which has not run yet, so it must stay as it was
    queryService.getQuerySql.mockImplementation(async (_t: string, r: any) => (r.query.iri === SUB_A ? `SELECT ${SUB_B}` : "SELECT 2"));
    await executeQuery("token", "SELECT 1", request(MAIN), resultSet, createExecutionContext());
    expect(helper.updateWithSQL.mock.calls.map(call => call[2])[0]).toBe(`SELECT ${SUB_B}`);
  });

  it("runs a queued result it finds, but reuses one that has already run", async () => {
    const MAIN = "http://example.org/q1";
    calls.existing.push(
      [{ id: 50, status: JobStatus.QUEUED }], // the main query
      [{ id: 51, status: JobStatus.COMPLETED }], // subA
      [{ id: 52, status: JobStatus.QUEUED }] // subB
    );

    await executeQuery("token", "SELECT 1", request(MAIN), resultSet, createExecutionContext());

    expect(helper.createQueryResultEntry).not.toHaveBeenCalled();
    expect(helper.markQueryResultRunning.mock.calls.map(call => call[0])).toEqual([50, 52]);
  });

  it("skips a query whose result has already run", async () => {
    calls.existing.push([{ id: 50, status: JobStatus.COMPLETED }]);
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, createExecutionContext());
    expect(db.execute).not.toHaveBeenCalled();
    expect(helper.markQueryResultRunning).not.toHaveBeenCalled();
  });

  it("does not cache a failed lookup", async () => {
    queryService.getQueryRequestForSQL.mockRejectedValueOnce(new Error("IMAPI down")).mockImplementation(async (_t: string, r: any) => request(r.query.iri));
    const ctx = createExecutionContext();

    await expect(executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, ctx)).rejects.toThrow("IMAPI down");
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, ctx);

    expect(db.execute).toHaveBeenCalled();
  });
});

describe("executeDatasetQuery", () => {
  it("records the part that failed in the SQL it saves", async () => {
    helper.updateWithSQL.mockReset().mockResolvedValue(undefined);
    db.execute.mockReset().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("bad sql"));

    await expect(
      executeDatasetQuery("SELECT 1\n----------------------------------------\nSELECT 2", request("http://example.org/d"), {}, 100, resultSet)
    ).rejects.toThrow("bad sql");

    expect(helper.updateWithSQL.mock.calls[0]![2]).toBe("SELECT 1\nSELECT 2\n");
  });
});

describe("getIndicatorSubQueryRequests", () => {
  it("returns every sub query in its original order", async () => {
    queryService.getSubqueryIris.mockReset().mockResolvedValue([{ iri: SUB_A }, { iri: SUB_B }]);
    queryService.getQueryRequestForSQL.mockReset().mockImplementation(async (_t: string, r: any) => {
      // The first finishes last: order must still follow the input, not completion
      await new Promise(resolve => setTimeout(resolve, r.query.iri === SUB_A ? 10 : 1));
      return request(r.query.iri);
    });
    queryService.getQuerySql.mockReset().mockImplementation(async (_t: string, r: any) => `SQL for ${r.query.iri}`);

    const result = await getIndicatorSubQueryRequests("token", request("http://example.org/indicator"), 7);

    expect(result.map(r => r.queryRequest.query.iri)).toEqual([SUB_A, SUB_B]);
    expect(result.map(r => r.sql)).toEqual([`SQL for ${SUB_A}`, `SQL for ${SUB_B}`]);
  });
});

describe("linkIndicatorSubQueries", () => {
  it("links only the indicator's direct sub queries", async () => {
    const INDICATOR = "http://example.org/indicator";
    queryService.getSubqueryIris.mockReset().mockResolvedValue([
      { iri: SUB_A, parentIris: [INDICATOR] },
      { iri: SUB_B, parentIris: [SUB_A] },
      { iri: "http://example.org/subC", parentIris: null }
    ]);
    helper.linkQueryResultsToIndicator.mockReset().mockResolvedValue(undefined);
    const ctx = createExecutionContext();
    const indicatorRequest = { query: { iri: INDICATOR, queryType: IMQType.INDICATOR } } as any;

    await linkIndicatorSubQueries("token", indicatorRequest, resultSet, 5, ctx);

    expect(helper.linkQueryResultsToIndicator).toHaveBeenCalledWith(5, 1, [SUB_A]);
    expect(queryService.getSubqueryIris).toHaveBeenCalledWith("token", INDICATOR, true);
  });
});

describe("prepareIndicatorSubQueries", () => {
  it("creates each missing result once and links the direct ones before anything runs", async () => {
    const INDICATOR = "http://example.org/indicator";
    calls.existing.length = 0;
    calls.existing.push([], [{ id: 60, status: JobStatus.QUEUED }]);
    helper.createQueryResultEntry.mockReset().mockResolvedValue(61);
    helper.linkQueryResultsToIndicator.mockReset().mockResolvedValue(undefined);
    queryService.getSubqueryIris.mockReset().mockResolvedValue([
      { iri: SUB_A, parentIris: [INDICATOR] },
      { iri: SUB_B, parentIris: [SUB_A] }
    ]);

    await prepareIndicatorSubQueries(
      "token",
      { query: { iri: INDICATOR, queryType: IMQType.INDICATOR } } as any,
      [request(SUB_A), request(SUB_B)],
      resultSet,
      5,
      createExecutionContext()
    );

    expect(helper.createQueryResultEntry).toHaveBeenCalledTimes(1);
    expect(helper.createQueryResultEntry.mock.calls[0]![0].query.iri).toBe(SUB_A);
    expect(helper.linkQueryResultsToIndicator).toHaveBeenCalledWith(5, 1, [SUB_A]);
  });
});

describe("hashQueryRequest", () => {
  it("does not depend on argument order", () => {
    const a = {
      query: { iri: "http://example.org/q" },
      argument: [
        { parameter: "$a", valueData: "1" },
        { parameter: "$b", valueData: "2" }
      ]
    } as any;
    const b = {
      query: { iri: "http://example.org/q" },
      argument: [
        { parameter: "$b", valueData: "2" },
        { parameter: "$a", valueData: "1" }
      ]
    } as any;
    expect(hashQueryRequest(a)).toBe(hashQueryRequest(b));
  });

  it("is stable: stored query versions must keep matching", () => {
    // Computed from the original algorithm: murmurhash.v3("$searchDate" + "2026-01-01" + iri). If this changes, every cached version in the database stops matching.
    const hash = hashQueryRequest({ query: { iri: "http://example.org/q" }, argument: [{ parameter: "$searchDate", valueData: "2026-01-01" }] } as any);
    expect(hash).toBe(697473618);
  });
});
