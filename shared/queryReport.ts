/**
 * Runs every query listed in one or more gauge spec tables, each as its own job so one failing query does not take the others down,
 * and builds an HTML report with each query's iri, name, status and result count, plus the definition, executed SQL and SQL error for
 * any that did not pass.
 *
 * Shared by the `pnpm test:queries` script (tests/queries/runQueries.js) and the "Query reports" menu in the UI (app/utils/queryReport.ts),
 * which each supply a QueryReportApi for their own way of calling the API. Node loads this file directly (type stripping), so it must
 * only use erasable TypeScript syntax and type-only imports.
 */
import type { QueryResultSummary } from "~~/models";

export type QueryReportSuite = "default" | "qof" | "smh" | "all";

/** Spec files live in tests/e2e/specs/queries/. */
export const QUERY_REPORT_SUITES: Record<QueryReportSuite, { label: string; specs: string[] }> = {
  default: { label: "Test & registration queries", specs: ["queries.spec.md", "reg_queries.spec.md"] },
  qof: { label: "QOF queries", specs: ["qof_queries.spec.md"] },
  smh: { label: "SMH queries", specs: ["smh_queries.spec.md"] },
  all: { label: "All queries", specs: ["queries.spec.md", "reg_queries.spec.md", "qof_queries.spec.md", "smh_queries.spec.md"] }
};

/** How the runner reaches the API. Each call throws on failure; errorText() turns what it throws into a message. */
export interface QueryReportApi {
  addJob(body: { jobName: string; queryRequests: unknown[] }): Promise<{ jobId?: number } | undefined>;
  getJob(jobId: number): Promise<{ status: string; error?: any }>;
  getSummaries(jobId: number): Promise<QueryResultSummary[]>;
  getDefinition(iri: string): Promise<unknown>;
}

export interface SpecQuery {
  spec: string;
  iri: string;
  label: string;
  expectedCount: string;
}

export interface QueryReportResult extends SpecQuery {
  name: string;
  status: string;
  count: number | null;
  jobId: number | null;
  durationMs: number;
  error?: string;
  sqlError?: string;
  executedSql?: string;
  definition?: unknown;
}

export interface RunOptions {
  /** Jobs in flight at once */
  concurrency: number;
  /** ms per job */
  timeout: number;
  onProgress?: (done: number, total: number, result?: QueryReportResult) => void;
}

const POLL_INTERVAL = 1000;
const TERMINAL_STATUSES = ["COMPLETED", "ERRORED", "CANCELLED"];

/** Reads the `| iri | count | label |` rows of a gauge spec's data table. */
export function readSpec(spec: string, text: string): SpecQuery[] {
  const lines = text.split("\n");
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map(cell => cell.trim().replace(/^"(.*)"$/, "$1"));
  const headerIndex = lines.findIndex(line => line.trim().startsWith("|") && cells(line).includes("iri"));
  if (headerIndex === -1) throw new Error(`No table with an "iri" column in ${spec}`);

  const header = cells(lines[headerIndex]!);
  const rows: SpecQuery[] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const row: Record<string, string> = Object.fromEntries(header.map((name, i) => [name, cells(line)[i] ?? ""]));
    if (row.iri) rows.push({ spec, iri: row.iri, label: row.label || "", expectedCount: row.count || "" });
  }
  return rows;
}

/** Message for an error thrown by a QueryReportApi call ($fetch errors carry the server's message in `data`). */
export function errorText(err: any): string {
  return err?.data?.message || err?.data?.statusMessage || err?.message || String(err);
}

async function runQuery(api: QueryReportApi, query: SpecQuery, timeout: number): Promise<QueryReportResult> {
  const started = Date.now();
  const result: QueryReportResult = { ...query, name: query.label, status: "", count: null, jobId: null, durationMs: 0 };

  try {
    const added = await api.addJob({ jobName: `[report] ${query.label || query.iri}`, queryRequests: [{ query: { iri: query.iri }, argument: [] }] });
    if (!added?.jobId) {
      result.status = "SUBMIT_FAILED";
      result.error = "Job add returned no jobId (check the RabbitMQ connection)";
      return finish(api, result, started);
    }
    result.jobId = added.jobId;
  } catch (err) {
    result.status = "SUBMIT_FAILED";
    result.error = errorText(err);
    return finish(api, result, started);
  }

  let job: { status: string; error?: any } | undefined;
  while (Date.now() - started < timeout) {
    job = await api.getJob(result.jobId);
    if (TERMINAL_STATUSES.includes(job.status)) break;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
  result.status = job && TERMINAL_STATUSES.includes(job.status) ? job.status : "TIMEOUT";

  if (result.status === "COMPLETED") {
    try {
      const summaries = await api.getSummaries(result.jobId);
      const summary = summaries.find(s => s.queryIri === query.iri) || summaries[0];
      if (summary) {
        result.count = summary.totalCount;
        result.name = summary.queryName || result.name;
      }
    } catch (err) {
      result.error = `Could not load result summary: ${errorText(err)}`;
    }
    if (query.expectedCount !== "" && String(result.count) !== query.expectedCount) result.status = "COUNT_MISMATCH";
  } else if (result.status === "ERRORED") {
    const error = job?.error || {};
    result.error = error.message || JSON.stringify(error);
    result.sqlError = error.cause?.sqlMessage || error.cause?.message || "";
    result.executedSql = error.cause?.sql || "";
  } else if (result.status === "TIMEOUT") {
    result.error = `Job still "${job?.status}" after ${timeout}ms`;
  }
  return finish(api, result, started);
}

/** Anything that did not pass also gets the query definition, to see what was run. */
async function finish(api: QueryReportApi, result: QueryReportResult, started: number): Promise<QueryReportResult> {
  if (result.status !== "COMPLETED") {
    try {
      result.definition = await api.getDefinition(result.iri);
    } catch (err) {
      result.definition = `Could not load definition: ${errorText(err)}`;
    }
  }
  result.durationMs = Date.now() - started;
  return result;
}

export async function runQueries(api: QueryReportApi, queries: SpecQuery[], options: RunOptions): Promise<QueryReportResult[]> {
  const results: QueryReportResult[] = new Array(queries.length);
  let next = 0;
  let done = 0;
  options.onProgress?.(0, queries.length);

  async function worker() {
    while (next < queries.length) {
      const index = next++;
      const query = queries[index]!;
      try {
        results[index] = await runQuery(api, query, options.timeout);
      } catch (err: any) {
        results[index] = { ...query, name: query.label, status: "SCRIPT_ERROR", count: null, jobId: null, durationMs: 0, error: String(err?.stack || err) };
      }
      options.onProgress?.(++done, queries.length, results[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(options.concurrency, queries.length) }, worker));
  return results;
}

/** 75000 -> "1m 15s" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours && `${hours}h`, (hours || minutes) && `${minutes}m`, `${seconds}s`].filter(Boolean).join(" ");
}

/** "2026-10-12T10:00:00.000Z" -> "2026-10-12T10-00-00-000Z", for file names */
export function fileStamp(isoDate: string): string {
  return isoDate.replace(/[:.]/g, "-");
}

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function htmlReport(results: QueryReportResult[], run: { baseUrl: string; startedAt: string; durationMs: number }): string {
  const totals = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  const rows = results
    .map((r, i) => {
      const details =
        r.status === "COMPLETED"
          ? ""
          : `<tr class="details"><td></td><td colspan="6">
              ${r.error ? `<h4>Error</h4><pre>${escape(r.error)}</pre>` : ""}
              ${r.sqlError ? `<h4>SQL error</h4><pre>${escape(r.sqlError)}</pre>` : ""}
              ${r.executedSql ? `<details><summary>Executed SQL</summary><pre>${escape(r.executedSql)}</pre></details>` : ""}
              ${r.definition ? `<details><summary>Definition</summary><pre>${escape(typeof r.definition === "string" ? r.definition : JSON.stringify(r.definition, null, 2))}</pre></details>` : ""}
            </td></tr>`;
      return `<tr class="${r.status}">
          <td>${i + 1}</td><td><code>${escape(r.iri)}</code></td><td>${escape(r.name)}</td><td><span class="tag">${escape(r.status)}</span></td>
          <td class="num">${escape(r.count)}</td><td class="num">${escape(r.expectedCount)}</td><td class="num">${r.jobId ?? ""}</td>
        </tr>${details}`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Query Report</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; position: sticky; top: 0; }
  .num { text-align: right; }
  .tag { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #fee2e2; color: #991b1b; }
  .COMPLETED .tag { background: #dcfce7; color: #166534; }
  .COUNT_MISMATCH .tag, .TIMEOUT .tag { background: #fef3c7; color: #92400e; }
  .details td { background: #fafafa; border-bottom: 2px solid #e5e7eb; }
  pre { white-space: pre-wrap; word-break: break-word; background: #f3f4f6; padding: 8px; max-height: 400px; overflow: auto; }
  h4 { margin: 8px 0 4px; }
</style></head><body>
<h1>Query Report</h1>
<p>${escape(run.baseUrl)} · ${escape(run.startedAt)} · took ${formatDuration(run.durationMs)} · ${results.length} queries · ${Object.entries(totals)
    .map(([status, n]) => `${escape(status)}: ${n}`)
    .join(" · ")}</p>
<table><thead><tr><th>#</th><th>IRI</th><th>Name</th><th>Status</th><th class="num">Count</th><th class="num">Expected</th><th class="num">Job</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}
