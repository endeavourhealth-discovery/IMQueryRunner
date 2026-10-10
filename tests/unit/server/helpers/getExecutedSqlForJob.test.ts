import { getExecutedSqlForJob } from "~~/server/helpers/mysqlHelper";

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ rows: [] as any[], calls: [] as string[] }));

vi.mock("~~/server/db/mysql", () => {
  // Records which builder methods were used, then resolves to the queued rows
  const chain: any = new Proxy(
    {},
    {
      get: (_, prop: string) => {
        if (prop === "then") return (res: any, rej: any) => Promise.resolve(state.rows).then(res, rej);
        return () => {
          state.calls.push(prop);
          return chain;
        };
      }
    }
  );
  return { mysqlDb: { select: () => chain } };
});
vi.mock("#server/utils/queueEvents.ts", () => ({ emitQueueUpdate: vi.fn() }));
vi.mock("~~/server/services/QueryService", () => ({ default: {} }));
vi.mock("~~/server/utils/executeQuery", () => ({ resolveArgs: vi.fn(), sortQueryRequestsByDependency: vi.fn() }));

describe("getExecutedSqlForJob", () => {
  beforeEach(() => {
    state.rows = [];
    state.calls.length = 0;
  });

  it("returns the recorded SQL", async () => {
    state.rows = [{ executedSql: "SELECT 1" }];
    await expect(getExecutedSqlForJob(7, "http://example.org/q")).resolves.toBe("SELECT 1");
  });

  it("returns an empty string when the result exists but no SQL was recorded", async () => {
    state.rows = [{ executedSql: null }];
    await expect(getExecutedSqlForJob(7, "http://example.org/q")).resolves.toBe("");
  });

  it("returns undefined when the job has no such result", async () => {
    state.rows = [];
    await expect(getExecutedSqlForJob(7, "http://example.org/q")).resolves.toBeUndefined();
  });

  it("looks across all of the job's result sets, earliest first, and takes only one row", async () => {
    state.rows = [{ executedSql: "x" }];
    await getExecutedSqlForJob(7, "http://example.org/q");
    expect(state.calls).toEqual(["from", "innerJoin", "where", "orderBy", "limit"]);
  });
});
