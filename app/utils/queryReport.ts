/**
 * Runs a query report suite from the browser with the signed-in user's session and downloads the HTML report.
 * The running and the report itself are shared with `pnpm test:queries` (shared/queryReport.ts).
 */
import { QUERY_REPORT_SUITES, fileStamp, htmlReport, readSpec, runQueries } from "#shared/queryReport";
import type { QueryReportApi, QueryReportResult, QueryReportSuite } from "#shared/queryReport";
import type { Job, QueryResultSummary } from "~~/models";

import type { Query } from "@endeavour/vue-library";

const CONCURRENCY = 50;
const JOB_TIMEOUT = 120000;

// Loaded only when a report is run, so the (large) spec tables are not part of the page bundle
const SPECS: Record<string, () => Promise<string>> = {
  "queries.spec.md": () => import("~~/tests/e2e/specs/queries/queries.spec.md?raw").then(m => m.default),
  "reg_queries.spec.md": () => import("~~/tests/e2e/specs/queries/reg_queries.spec.md?raw").then(m => m.default),
  "qof_queries.spec.md": () => import("~~/tests/e2e/specs/queries/qof_queries.spec.md?raw").then(m => m.default),
  "smh_queries.spec.md": () => import("~~/tests/e2e/specs/queries/smh_queries.spec.md?raw").then(m => m.default)
};

const api: QueryReportApi = {
  addJob: body => $fetch<{ jobId: number } | undefined>("/api/queue/job/add", { method: "POST", body }),
  getJob: jobId => $fetch<Job>(`/api/queue/job/${jobId}`),
  getSummaries: jobId => $fetch<QueryResultSummary[]>(`/api/queue/job/results/${jobId}/summary`),
  getDefinition: iri => $fetch<Query>("/api/imapi/query/queryFromIri", { query: { queryIri: iri } })
};

function download(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Runs the suite's queries, downloads the HTML report and returns the results. */
export async function runQueryReport(suite: QueryReportSuite, onProgress?: (done: number, total: number) => void): Promise<QueryReportResult[]> {
  const queries = (await Promise.all(QUERY_REPORT_SUITES[suite].specs.map(async spec => readSpec(spec, await SPECS[spec]!())))).flat();

  const startTime = Date.now();
  const startedAt = new Date(startTime).toISOString();
  const results = await runQueries(api, queries, { concurrency: CONCURRENCY, timeout: JOB_TIMEOUT, onProgress });

  const report = htmlReport(results, { baseUrl: window.location.origin, startedAt, durationMs: Date.now() - startTime });
  download(`query-report-${suite}-${fileStamp(startedAt)}.html`, report);
  return results;
}
