import { dependencyGraph, htmlReport, runQueries, subQueryLookup } from "#shared/queryReport";
import type { QueryReportApi, QueryReportResult } from "#shared/queryReport";
import type { QueryResultSummary } from "~~/models";

import { describe, expect, it } from "vitest";

const iri = (name: string) => `http://example.org/${name}`;

function summary(name: string, fields: Partial<QueryResultSummary> = {}): QueryResultSummary {
  return {
    totalCount: 1,
    queryName: name,
    queryIri: iri(name),
    queryType: "COHORT",
    status: "COMPLETED",
    startTime: null,
    endTime: null,
    ...fields
  } as QueryResultSummary;
}

function result(fields: Partial<QueryReportResult> = {}): QueryReportResult {
  return {
    spec: "s.md",
    iri: iri("a"),
    label: "a",
    expectedCount: "",
    name: "a",
    status: "COMPLETED",
    count: 1,
    jobId: 1,
    durationMs: 0,
    queuedMs: 0,
    ...fields
  };
}

describe("subQueryLookup", () => {
  it("returns the sub query results a query recorded, in order, skipping ids it does not know", () => {
    const [a, b, c] = [
      summary("a", { queryResultId: 1, subQueryResultIds: [3, 9, 2] }),
      summary("b", { queryResultId: 2 }),
      summary("c", { queryResultId: 3 })
    ];
    expect(subQueryLookup([a, b, c])(a)).toEqual([c, b]);
  });

  it("returns the results linked to an indicator, not the indicator itself or another indicator's", () => {
    const indicator = summary("i", { queryType: "INDICATOR", indicatorResultId: 7, totalCount: null } as Partial<QueryResultSummary>);
    const linked = summary("a", { queryResultId: 1, indicatorResultId: 7 });
    const other = summary("b", { queryResultId: 2, indicatorResultId: 8 });
    expect(subQueryLookup([indicator, linked, other])(indicator)).toEqual([linked]);
  });
});

describe("dependencyGraph", () => {
  it("is undefined for a query that is missing or has no sub queries", () => {
    expect(dependencyGraph([summary("a", { queryResultId: 1 })], iri("a"))).toBeUndefined();
    expect(dependencyGraph([], iri("a"))).toBeUndefined();
  });

  it("starts at the query and stores a shared sub query once", () => {
    const nodes = dependencyGraph(
      [
        summary("a", { queryResultId: 1, subQueryResultIds: [2, 3] }),
        summary("b", { queryResultId: 2, subQueryResultIds: [4] }),
        summary("c", { queryResultId: 3, subQueryResultIds: [4] }),
        summary("shared", { queryResultId: 4 })
      ],
      iri("a")
    )!;
    expect(nodes.map(node => [node.name, node.children])).toEqual([
      ["a", [1, 2]],
      ["b", [3]],
      ["c", [3]],
      ["shared", []]
    ]);
  });

  it("terminates on a cycle in the links", () => {
    const nodes = dependencyGraph(
      [summary("a", { queryResultId: 1, subQueryResultIds: [2] }), summary("b", { queryResultId: 2, subQueryResultIds: [1] })],
      iri("a")
    )!;
    expect(nodes.map(node => node.children)).toEqual([[1], [0]]);
  });

  it("gives each node its own status and count", () => {
    const nodes = dependencyGraph(
      [
        summary("a", { queryResultId: 1, subQueryResultIds: [2, 3], status: "ERRORED", totalCount: null } as Partial<QueryResultSummary>),
        summary("b", { queryResultId: 2, totalCount: 5 }),
        summary("c", { queryResultId: 3, status: "CANCELLED", totalCount: null } as Partial<QueryResultSummary>)
      ],
      iri("a")
    )!;
    expect(nodes.map(node => [node.status, node.count])).toEqual([
      ["ERRORED", null],
      ["COMPLETED", 5],
      ["CANCELLED", null]
    ]);
  });

  it("takes the duration from the times, which are ISO strings over JSON", () => {
    const times = { startTime: "2026-10-30T10:00:00.000Z", endTime: "2026-10-30T10:00:05.000Z" } as unknown as Partial<QueryResultSummary>;
    const nodes = dependencyGraph([summary("a", { queryResultId: 1, subQueryResultIds: [2], ...times }), summary("b", { queryResultId: 2 })], iri("a"))!;
    expect(nodes.map(node => node.durationMs)).toEqual([5000, null]);
  });
});

describe("runQueries", () => {
  const options = { concurrency: 1, timeout: 1000 };
  const query = { spec: "s.md", iri: iri("a"), label: "a", expectedCount: "" };
  const api = (job: object, summaries: QueryResultSummary[]): QueryReportApi => ({
    addJob: async () => ({ jobId: 1 }),
    getJob: async () => ({ status: "ERRORED", ...job }),
    getSummaries: async () => summaries,
    getDefinition: async () => ({})
  });

  it("reports the sub queries of a job that failed, without taking a count from one of them", async () => {
    const summaries = [
      summary("a", { queryResultId: 1, subQueryResultIds: [2], status: "ERRORED", totalCount: null } as Partial<QueryResultSummary>),
      summary("b", { queryResultId: 2, totalCount: 5 })
    ];
    const [report] = await runQueries(api({ error: { message: "bad sql" } }, summaries), [query], options);
    expect(report).toMatchObject({ status: "ERRORED", count: null, error: "bad sql" });
    expect(report!.dependencies!.map(node => [node.name, node.status, node.count])).toEqual([
      ["a", "ERRORED", null],
      ["b", "COMPLETED", 5]
    ]);
  });

  it("still reports the job's error when its sub queries cannot be loaded", async () => {
    const failing = { ...api({ error: { message: "bad sql" } }, []), getSummaries: () => Promise.reject(new Error("no")) };
    const [report] = await runQueries(failing, [query], options);
    expect(report).toMatchObject({ status: "ERRORED", error: "bad sql" });
  });
});

describe("htmlReport", () => {
  const run = { baseUrl: "http://localhost", startedAt: "2026-10-30T10:00:00.000Z", durationMs: 1000 };
  const embedded = (html: string) => JSON.parse(html.match(/<script type="application\/json" id="dependencies">(.*?)<\/script>/s)![1]!);

  it("only gives an expander to queries with dependencies, keyed by their row", () => {
    const nodes = [
      { iri: iri("a"), name: "a", status: "COMPLETED", count: 1, durationMs: 75000, children: [1] },
      { iri: iri("b"), name: "b", status: "ERRORED", count: null, durationMs: null, children: [] }
    ];
    const html = htmlReport([result(), result({ dependencies: nodes })], run);
    expect(html.match(/<td class="name"><button type="button" class="expander"/g)).toHaveLength(1);
    expect(embedded(html)).toEqual({
      1: [
        { iri: iri("a"), name: "a", status: "COMPLETED", count: 1, duration: "1m 15s", children: [1] },
        { iri: iri("b"), name: "b", status: "ERRORED", count: null, duration: "", children: [] }
      ]
    });
  });

  it("cannot have its embedded data break out of the script element", () => {
    const name = "</script><script>alert(1)</script>";
    const html = htmlReport([result({ dependencies: [{ iri: iri("a"), name, status: "COMPLETED", count: 1, durationMs: null, children: [] }] })], run);
    expect(html).not.toContain(name);
    expect(embedded(html)[0][0].name).toBe(name);
  });
});
