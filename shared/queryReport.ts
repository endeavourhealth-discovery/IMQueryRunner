/**
 * Runs every query listed in one or more gauge spec tables, each as its own job so one failing query does not take the others down,
 * and builds an HTML report with each query's iri, name, status and result count, plus the definition, executed SQL and SQL error for
 * any that did not pass. Queries that ran can be expanded to the sub queries they depended on, as in the UI's job table.
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
  getJob(jobId: number): Promise<QueryReportJob>;
  getSummaries(jobId: number): Promise<QueryResultSummary[]>;
  getDefinition(iri: string): Promise<unknown>;
}

/** Dates come back as ISO strings over JSON. runDate is set when a consumer picks the job up, finishDate when it ends. */
export interface QueryReportJob {
  status: string;
  error?: any;
  queueDate?: string | Date | null;
  runDate?: string | Date | null;
  finishDate?: string | Date | null;
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
  /** How long the query ran on the server, excluding time waiting in the queue; null if it never started. */
  durationMs: number | null;
  /** How long the job waited in the queue before a consumer picked it up (until the timeout if it never was). */
  queuedMs: number | null;
  error?: string;
  sqlError?: string;
  executedSql?: string;
  definition?: unknown;
  /** The sub queries of this query, whether or not they all ran; unset if it had none, or if its job never started. */
  dependencies?: DependencyNode[];
}

/**
 * One result in a query's dependency graph. nodes[0] is the query itself and children are indexes into the same array: a sub query shared
 * by several queries is stored once, as expanding it under every parent up front could be far larger than what is ever looked at.
 */
export interface DependencyNode {
  iri: string;
  name: string;
  status: string;
  /** null until it has completed, and always for an indicator: its results are its sub queries' */
  count: number | null;
  durationMs: number | null;
  children: number[];
}

export interface RunOptions {
  /** Jobs in flight at once */
  concurrency: number;
  /** ms per job */
  timeout: number;
  /** yyyy-mm-dd sent as $searchDate; the server uses today when omitted */
  searchDate?: string;
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

/** Looks up a result's direct sub queries among the summaries of its job. */
export function subQueryLookup(summaries: QueryResultSummary[]): (summary: QueryResultSummary) => QueryResultSummary[] {
  const summaryById = new Map(summaries.filter(summary => summary.queryResultId !== undefined).map(summary => [summary.queryResultId!, summary]));
  // An indicator's sub queries are the results linked to it, any other query's are the sub query results it recorded.
  // Compared as a string because this file cannot import the IMQType enum at runtime (see above).
  return summary =>
    String(summary.queryType) === "INDICATOR"
      ? summaries.filter(sub => sub.queryResultId !== undefined && sub.indicatorResultId === summary.indicatorResultId)
      : (summary.subQueryResultIds ?? []).map(id => summaryById.get(id)).filter((sub): sub is QueryResultSummary => !!sub);
}

/** The dependency graph of the query with this iri, or undefined if it has no sub queries. */
export function dependencyGraph(summaries: QueryResultSummary[], iri: string): DependencyNode[] | undefined {
  const root = summaries.find(summary => summary.queryIri === iri);
  if (!root) return undefined;
  const subQueriesOf = subQueryLookup(summaries);
  if (!subQueriesOf(root).length) return undefined;

  // Each result is visited once, so a cycle in the links ends here and only keeps expanding as far as someone clicks
  const indexes = new Map([[root, 0]]);
  const order = [root];
  const nodes: DependencyNode[] = [];
  for (const summary of order) {
    const children = subQueriesOf(summary).map(sub => {
      if (!indexes.has(sub)) {
        indexes.set(sub, order.length);
        order.push(sub);
      }
      return indexes.get(sub)!;
    });
    const durationMs = summary.startTime && summary.endTime ? Math.max(new Date(summary.endTime).getTime() - new Date(summary.startTime).getTime(), 0) : null;
    nodes.push({ iri: summary.queryIri, name: summary.queryName, status: summary.status, count: summary.totalCount, durationMs, children });
  }
  return nodes;
}

async function runQuery(api: QueryReportApi, query: SpecQuery, timeout: number, searchDate?: string): Promise<QueryReportResult> {
  const started = Date.now();
  const result: QueryReportResult = { ...query, name: query.label, status: "", count: null, jobId: null, durationMs: null, queuedMs: null };

  try {
    const argument = searchDate ? [{ parameter: "$searchDate", valueData: searchDate }] : [];
    const added = await api.addJob({ jobName: `[report] ${query.label || query.iri}`, queryRequests: [{ query: { iri: query.iri }, argument }] });
    if (!added?.jobId) {
      result.status = "SUBMIT_FAILED";
      result.error = "Job add returned no jobId (check the RabbitMQ connection)";
      return finish(api, result);
    }
    result.jobId = added.jobId;
  } catch (err) {
    result.status = "SUBMIT_FAILED";
    result.error = errorText(err);
    return finish(api, result);
  }

  // Jobs wait in the queue for a free consumer, so time from submission is not how long the query took. Finished jobs are timed from the
  // server's own runDate/finishDate; a job still running at the timeout is timed from when this loop first saw it running.
  let job: QueryReportJob | undefined;
  let seenRunning: number | undefined;
  while (Date.now() - started < timeout) {
    job = await api.getJob(result.jobId);
    if (job.status !== "QUEUED") seenRunning ??= Date.now();
    if (TERMINAL_STATUSES.includes(job.status)) break;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
  result.status = job && TERMINAL_STATUSES.includes(job.status) ? job.status : "TIMEOUT";
  const now = Date.now();
  const time = (date: string | Date | null | undefined) => (date ? new Date(date).getTime() : undefined);
  const [queueDate, runDate, finishDate] = [time(job?.queueDate), time(job?.runDate), time(job?.finishDate)];
  if (runDate !== undefined && finishDate !== undefined) result.durationMs = Math.max(finishDate - runDate, 0);
  else if (seenRunning !== undefined && result.status === "TIMEOUT") result.durationMs = now - seenRunning;
  result.queuedMs = queueDate !== undefined && runDate !== undefined ? Math.max(runDate - queueDate, 0) : (seenRunning ?? now) - started;

  // Every outcome, as a job that failed or timed out is where the status of its sub queries matters most
  try {
    const summaries = await api.getSummaries(result.jobId);
    result.dependencies = dependencyGraph(summaries, query.iri);
    result.name = summaries.find(s => s.queryIri === query.iri)?.queryName || result.name;
    if (result.status === "COMPLETED") {
      // An indicator's own summary has no count, so it is read from its results as before
      const counted = summaries.filter(s => s.totalCount !== null);
      const summary = counted.find(s => s.queryIri === query.iri) || counted[0];
      if (summary) {
        result.count = summary.totalCount;
        result.name = summary.queryName || result.name;
      }
    }
  } catch (err) {
    result.error = `Could not load result summary: ${errorText(err)}`;
  }

  if (result.status === "COMPLETED") {
    if (query.expectedCount !== "" && String(result.count) !== query.expectedCount) result.status = "COUNT_MISMATCH";
  } else if (result.status === "ERRORED") {
    const error = job?.error || {};
    result.error = error.message || JSON.stringify(error);
    result.sqlError = error.cause?.sqlMessage || error.cause?.message || "";
    result.executedSql = error.cause?.sql || "";
  } else if (result.status === "TIMEOUT") {
    result.error = `Job still "${job?.status}" after ${timeout}ms`;
  }
  return finish(api, result);
}

/** Anything that did not pass also gets the query definition, to see what was run. */
async function finish(api: QueryReportApi, result: QueryReportResult): Promise<QueryReportResult> {
  if (result.status !== "COMPLETED") {
    try {
      result.definition = await api.getDefinition(result.iri);
    } catch (err) {
      result.definition = `Could not load definition: ${errorText(err)}`;
    }
  }
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
        results[index] = await runQuery(api, query, options.timeout, options.searchDate);
      } catch (err: any) {
        results[index] = {
          ...query,
          name: query.label,
          status: "SCRIPT_ERROR",
          count: null,
          jobId: null,
          durationMs: null,
          queuedMs: null,
          error: String(err?.stack || err)
        };
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

const EXPANDER = '<button type="button" class="expander" aria-expanded="false" aria-label="Toggle dependencies"></button>';

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function htmlReport(results: QueryReportResult[], run: { baseUrl: string; startedAt: string; durationMs: number }): string {
  const totals = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  // Rows for dependencies are only built when expanded. "<" is escaped so a name cannot end the script element this is embedded in.
  const dependencies = JSON.stringify(
    Object.fromEntries(
      results.flatMap((r, i) =>
        r.dependencies
          ? [[i, r.dependencies.map(({ durationMs, ...node }) => ({ ...node, duration: durationMs === null ? "" : formatDuration(durationMs) }))]]
          : []
      )
    )
  ).replace(/</g, "\\u003c");
  const rows = results
    .map((r, i) => {
      const details =
        r.status === "COMPLETED"
          ? ""
          : `<tr class="details" data-status="${escape(r.status)}"><td></td><td colspan="8">
              ${r.sqlError ? `<h4>SQL error</h4><pre class="copy" title="Click to copy">${escape(r.sqlError)}</pre>` : ""}
              ${r.error ? `<details><summary>Error</summary><pre class="copy" title="Click to copy">${escape(r.error)}</pre></details>` : ""}
              ${r.executedSql ? `<details><summary>Executed SQL</summary><pre class="copy" title="Click to copy">${escape(r.executedSql)}</pre></details>` : ""}
              ${r.definition ? `<details><summary>Definition</summary><pre class="copy" title="Click to copy">${escape(typeof r.definition === "string" ? r.definition : JSON.stringify(r.definition, null, 2))}</pre></details>` : ""}
            </td></tr>`;
      return `<tr class="${r.status}" data-status="${escape(r.status)}" data-index="${i}" data-duration="${r.durationMs ?? ""}" data-queued="${r.queuedMs ?? ""}">
          <td>${i + 1}</td><td><code>${escape(r.iri)}</code></td><td class="name">${r.dependencies ? EXPANDER : '<span class="expander-space"></span>'}${escape(r.name)}</td><td><span class="tag">${escape(r.status)}</span></td>
          <td class="num">${escape(r.count)}</td><td class="num">${escape(r.expectedCount)}</td><td class="num">${r.jobId ?? ""}</td>
          <td class="num">${r.durationMs === null ? "" : formatDuration(r.durationMs)}</td><td class="num">${r.queuedMs === null ? "" : formatDuration(r.queuedMs)}</td>
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
  .RUNNING .tag, .tag.RUNNING { background: #dbeafe; color: #1e40af; }
  .QUEUED .tag, .CANCELLED .tag, .tag.QUEUED, .tag.CANCELLED { background: #e5e7eb; color: #374151; }
  .tag.COMPLETED { background: #dcfce7; color: #166534; }
  .details td { background: #fafafa; border-bottom: 2px solid #e5e7eb; }
  pre { white-space: pre-wrap; word-break: break-word; background: #f3f4f6; padding: 8px; max-height: 400px; overflow: auto; }
  h4 { margin: 8px 0 4px; }
  pre.copy { cursor: pointer; }
  pre.copy:hover { outline: 1px solid #9ca3af; }
  .copied-badge { position: fixed; padding: 2px 6px; border-radius: 4px; font-size: 12px; background: #16a34a; color: #fff; pointer-events: none; transform: translateX(-100%); }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 12px; font-size: 14px; }
  .filters label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
  .filters button { font: inherit; font-size: 12px; padding: 2px 8px; cursor: pointer; }
  tr.hidden { display: none; }
  th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
  th.sortable:hover { background: #e5e7eb; }
  th[data-order="desc"]::after { content: " ▼"; }
  th[data-order="asc"]::after { content: " ▲"; }
  td.name { padding-left: 32px; }
  .expander, .expander-space { display: inline-block; width: 20px; margin: 0 4px 0 -24px; }
  .expander { padding: 0; border: 0; background: none; color: #6b7280; font-size: 12px; cursor: pointer; }
  .expander:hover { color: #1f2937; }
  .expander::before { content: "▶"; }
  .expander[aria-expanded="true"]::before { content: "▼"; }
  tr.dep td { background: #f9fafb; }
</style></head><body>
<h1>Query Report</h1>
<p>${escape(run.baseUrl)} · ${escape(run.startedAt)} · took ${formatDuration(run.durationMs)} · ${results.length} queries · ${Object.entries(totals)
    .map(([status, n]) => `${escape(status)}: ${n}`)
    .join(" · ")}</p>
<div class="filters"><strong>Status:</strong>
  ${Object.entries(totals)
    .map(
      ([status, n]) =>
        `<label class="${escape(status)}"><input type="checkbox" value="${escape(status)}" checked><span class="tag">${escape(status)} (${n})</span></label>`
    )
    .join("\n  ")}
  <button type="button" data-select="all">All</button>
  <button type="button" data-select="failed">Failed only</button>
</div>
<table><thead><tr><th>#</th><th>IRI</th><th>Name</th><th>Status</th><th class="num">Count</th><th class="num">Expected</th><th class="num">Job</th><th class="num sortable" data-sort="duration" title="Time the query ran on the server (click to sort)">Duration</th><th class="num sortable" data-sort="queued" title="Time waiting in the queue for a consumer (click to sort)">Queued</th></tr></thead>
<tbody>${rows}</tbody></table>
<script type="application/json" id="dependencies">${dependencies}</script>
<script>
  const boxes = [...document.querySelectorAll(".filters input")];
  function applyFilter() {
    const shown = new Set(boxes.filter(b => b.checked).map(b => b.value));
    for (const row of document.querySelectorAll("tbody tr")) row.classList.toggle("hidden", !shown.has(row.dataset.status));
  }
  boxes.forEach(b => b.addEventListener("change", applyFilter));
  document.querySelectorAll(".filters button").forEach(button =>
    button.addEventListener("click", () => {
      boxes.forEach(b => (b.checked = button.dataset.select === "all" || b.value !== "COMPLETED"));
      applyFilter();
    })
  );

  // Each click on a sortable header cycles longest first -> shortest first -> report order. Rows without a value go last, and a
  // query's details and expanded dependency rows move with it.
  const tbody = document.querySelector("tbody");
  function rowGroups() {
    const groups = [];
    for (const row of tbody.children) {
      if (row.matches(".details, .dep")) groups.at(-1).push(row);
      else groups.push([row]);
    }
    return groups;
  }
  const sortHeaders = [...document.querySelectorAll("th.sortable")];
  sortHeaders.forEach(th =>
    th.addEventListener("click", () => {
      const order = { "": "desc", desc: "asc", asc: "" }[th.dataset.order || ""];
      sortHeaders.forEach(other => delete other.dataset.order);
      if (order) th.dataset.order = order;
      const value = group => (group[0].dataset[th.dataset.sort] === "" ? null : Number(group[0].dataset[th.dataset.sort]));
      const sorted = rowGroups().sort((a, b) => {
        if (!order) return a[0].dataset.index - b[0].dataset.index;
        const [x, y] = [value(a), value(b)];
        if (x === null || y === null) return (x === null) - (y === null);
        return order === "desc" ? y - x : x - y;
      });
      tbody.append(...sorted.flat());
    })
  );

  // A dependency row shows its own status, but is filtered by the status of the query it is under, so the filter shows and hides them together
  const dependencies = JSON.parse(document.getElementById("dependencies").textContent);
  const depthOf = row => Number(row.dataset.depth || 0);

  function dependencyRow(parent, child) {
    const node = dependencies[parent.dataset.index][child];
    const row = document.createElement("tr");
    row.className = "dep";
    Object.assign(row.dataset, { index: parent.dataset.index, node: child, depth: depthOf(parent) + 1, status: parent.dataset.status });
    const cell = text => row.appendChild(document.createElement("td")).append(text);
    cell("");
    row.appendChild(document.createElement("td")).appendChild(document.createElement("code")).textContent = node.iri;
    const name = row.appendChild(document.createElement("td"));
    name.className = "name";
    name.style.paddingLeft = 32 + depthOf(row) * 24 + "px";
    if (node.children.length) name.insertAdjacentHTML("beforeend", ${JSON.stringify(EXPANDER)});
    else name.appendChild(document.createElement("span")).className = "expander-space";
    name.append(node.name);
    const status = row.appendChild(document.createElement("td")).appendChild(document.createElement("span"));
    status.className = "tag " + node.status;
    status.textContent = node.status;
    for (const value of [node.count ?? "", "", "", node.duration, ""]) {
      const td = row.appendChild(document.createElement("td"));
      td.className = "num";
      td.textContent = value;
    }
    return row;
  }

  tbody.addEventListener("click", event => {
    const expander = event.target.closest(".expander");
    if (!expander) return;
    const row = expander.closest("tr");
    const expanded = expander.getAttribute("aria-expanded") === "true";
    expander.setAttribute("aria-expanded", String(!expanded));
    if (expanded) {
      while (row.nextElementSibling?.classList.contains("dep") && depthOf(row.nextElementSibling) > depthOf(row)) row.nextElementSibling.remove();
    } else {
      const node = dependencies[row.dataset.index][row.dataset.node || 0];
      row.after(...node.children.map(child => dependencyRow(row, child)));
    }
  });

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value: text });
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }
  document.querySelectorAll("pre.copy").forEach(pre =>
    pre.addEventListener("click", async () => {
      if (String(window.getSelection())) return; // let the user select part of the text
      await copyText(pre.textContent);
      const rect = pre.getBoundingClientRect();
      const badge = Object.assign(document.createElement("span"), { className: "copied-badge", textContent: "Copied!" });
      Object.assign(badge.style, { top: Math.max(rect.top, 0) + 6 + "px", left: rect.right - 6 + "px" });
      document.body.appendChild(badge);
      setTimeout(() => badge.remove(), 1500);
    })
  );
</script>
</body></html>`;
}
