import { createExecutionContext, executeQuery, getIndicatorSubQueryRequests, hashQueryRequest } from "~~/server/utils/executeQuery";

import { IMQType } from "@endeavour/vue-library/enums";

import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ order: [] as string[] }));
const queryService = vi.hoisted(() => ({
  getSubqueryIris: vi.fn(),
  getQueryRequestForSQL: vi.fn(),
  getQuerySql: vi.fn(),
  getQuerySqlDebug: vi.fn()
}));
const helper = vi.hoisted(() => ({
  createQueryResultEntry: vi.fn(),
  getToday: vi.fn(() => "2026-01-01"),
  updateWithEndTime: vi.fn(),
  updateWithSQL: vi.fn()
}));
const db = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("~~/server/db/mysql", () => {
  // Any select().from()...where().limit() resolves to "no rows", i.e. nothing cached yet
  const chain: any = new Proxy({}, { get: (_, prop) => (prop === "then" ? (res: any, rej: any) => Promise.resolve([]).then(res, rej) : () => chain) });
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
    let nextId = 100;
    helper.createQueryResultEntry.mockReset().mockImplementation(async () => nextId++);
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

  it("does not cache a failed lookup", async () => {
    queryService.getQueryRequestForSQL.mockRejectedValueOnce(new Error("IMAPI down")).mockImplementation(async (_t: string, r: any) => request(r.query.iri));
    const ctx = createExecutionContext();

    await expect(executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, ctx)).rejects.toThrow("IMAPI down");
    await executeQuery("token", "SELECT 1", request("http://example.org/q1"), resultSet, ctx);

    expect(db.execute).toHaveBeenCalled();
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
