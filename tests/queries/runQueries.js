/**
 * Runs every query listed in one or more gauge spec tables straight against the API (no UI steps), then writes an HTML and JSON report
 * with each query's iri, name, status and result count, plus the definition, executed SQL and SQL error for any that errored.
 *
 * Usage: pnpm test:queries [spec.md ...]   (defaults to tests/e2e/specs/queries/queries.spec.md)
 *
 * Env: BASE_URL, TEST_USERNAME, TEST_PASSWORD, QUERY_CONCURRENCY (jobs in flight, default 4), QUERY_TIMEOUT (ms per job, default 600000),
 *      headless_chrome (set to "false" to watch the login)
 *
 * The API needs a nuxt-auth-utils session, which only the Casdoor OIDC flow can create, so a headless browser signs in once and its
 * cookies are then used for plain API requests. Each query runs as its own job so one failing query does not take the others down.
 */

const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const CONCURRENCY = Number.parseInt(process.env.QUERY_CONCURRENCY || "4");
const JOB_TIMEOUT = Number.parseInt(process.env.QUERY_TIMEOUT || "600000");
const POLL_INTERVAL = 2000;
const TERMINAL_STATUSES = ["COMPLETED", "ERRORED", "CANCELLED"];
const DEFAULT_SPECS = [
  "tests/e2e/specs/queries/queries.spec.md",
  "tests/e2e/specs/queries/reg_queries.spec.md",
  "tests/e2e/specs/queries/qof_queries.spec.md",
  "tests/e2e/specs/queries/smh_queries.spec.md"
];
const OUTPUT_DIR = path.join(__dirname, "outputs");

/** Reads the `| iri | count | label |` rows of a gauge spec's data table. */
function readSpec(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const cells = line =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map(cell => cell.trim().replace(/^"(.*)"$/, "$1"));
  const headerIndex = lines.findIndex(line => line.trim().startsWith("|") && cells(line).includes("iri"));
  if (headerIndex === -1) throw new Error(`No table with an "iri" column in ${file}`);

  const header = cells(lines[headerIndex]);
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const row = Object.fromEntries(header.map((name, i) => [name, cells(line)[i] ?? ""]));
    if (row.iri) rows.push({ spec: path.basename(file), iri: row.iri, label: row.label || "", expectedCount: row.count || "" });
  }
  return rows;
}

async function login(browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/auth/login?redirect=/`);
  await page.fill('input[placeholder="username, Email or phone"]', process.env.TEST_USERNAME || "testuser");
  await page.fill('input[placeholder="Password"]', process.env.TEST_PASSWORD || "testpass");
  await page.click("button >> text=Sign In");
  await page.waitForURL(url => url.origin === new URL(BASE_URL).origin, { timeout: 60000 });
  await page.close();

  const session = await (await context.request.get("/api/_auth/session")).json().catch(() => ({}));
  if (!session.user) throw new Error("Login did not create a session");
  return context.request;
}

async function json(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorText(body, status) {
  return (body && (body.message || body.statusMessage)) || (typeof body === "string" && body) || `HTTP ${status}`;
}

async function runQuery(api, query) {
  const started = Date.now();
  const result = { ...query, name: query.label, status: "", count: null, jobId: null, durationMs: 0 };

  const addResponse = await api.post("/api/queue/job/add", {
    data: { jobName: `[api] ${query.label || query.iri}`, queryRequests: [{ query: { iri: query.iri }, argument: [] }] },
    timeout: JOB_TIMEOUT
  });
  const added = await json(addResponse);
  if (!addResponse.ok() || !added || !added.jobId) {
    result.status = "SUBMIT_FAILED";
    result.error = addResponse.ok() ? "Job add returned no jobId (check the RabbitMQ connection)" : errorText(added, addResponse.status());
    return finish(api, result, started);
  }
  result.jobId = added.jobId;

  let job;
  while (Date.now() - started < JOB_TIMEOUT) {
    job = await json(await api.get(`/api/queue/job/${result.jobId}`));
    if (TERMINAL_STATUSES.includes(job.status)) break;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
  result.status = TERMINAL_STATUSES.includes(job?.status) ? job.status : "TIMEOUT";

  if (result.status === "COMPLETED") {
    const summaryResponse = await api.get(`/api/queue/job/results/${result.jobId}/summary`);
    const summaries = await json(summaryResponse);
    if (summaryResponse.ok() && Array.isArray(summaries)) {
      const summary = summaries.find(s => s.queryIri === query.iri) || summaries[0];
      if (summary) {
        result.count = summary.totalCount;
        result.name = summary.queryName || result.name;
      }
    } else {
      result.error = `Could not load result summary: ${errorText(summaries, summaryResponse.status())}`;
    }
    if (query.expectedCount !== "" && String(result.count) !== query.expectedCount) result.status = "COUNT_MISMATCH";
  } else if (result.status === "ERRORED") {
    const error = job.error || {};
    result.error = error.message || JSON.stringify(error);
    result.sqlError = error.cause?.sqlMessage || error.cause?.message || "";
    result.executedSql = error.cause?.sql || "";
  } else if (result.status === "TIMEOUT") {
    result.error = `Job still "${job?.status}" after ${JOB_TIMEOUT}ms`;
  }
  return finish(api, result, started);
}

/** Anything that did not pass also gets the query definition, to see what was run. */
async function finish(api, result, started) {
  if (result.status !== "COMPLETED") {
    const response = await api.get(`/api/imapi/query/queryFromIri?queryIri=${encodeURIComponent(result.iri)}`);
    result.definition = response.ok() ? await json(response) : `Could not load definition: ${errorText(await json(response), response.status())}`;
  }
  result.durationMs = Date.now() - started;
  return result;
}

async function runAll(api, queries) {
  const results = new Array(queries.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < queries.length) {
      const index = next++;
      try {
        results[index] = await runQuery(api, queries[index]);
      } catch (err) {
        results[index] = { ...queries[index], name: queries[index].label, status: "SCRIPT_ERROR", count: null, error: String(err?.stack || err) };
      }
      const r = results[index];
      console.log(`[${++done}/${queries.length}] ${r.status.padEnd(14)} ${String(r.count ?? "").padStart(8)}  ${r.name || r.iri}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queries.length) }, worker));
  return results;
}

const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function htmlReport(results, startedAt) {
  const totals = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
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
<p>${escape(BASE_URL)} · ${escape(startedAt)} · ${results.length} queries · ${Object.entries(totals)
    .map(([status, n]) => `${escape(status)}: ${n}`)
    .join(" · ")}</p>
<table><thead><tr><th>#</th><th>IRI</th><th>Name</th><th>Status</th><th class="num">Count</th><th class="num">Expected</th><th class="num">Job</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
}

async function main() {
  const specs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SPECS;
  const queries = specs.flatMap(readSpec);
  console.log(`Running ${queries.length} queries from ${specs.join(", ")} against ${BASE_URL} (${CONCURRENCY} at a time)`);

  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: process.env.headless_chrome !== "false" });
  let results;
  try {
    const api = await login(browser);
    results = await runAll(api, queries);
  } finally {
    await browser.close();
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const stamp = startedAt.replace(/[:.]/g, "-");
  const htmlFile = path.join(OUTPUT_DIR, `query-report-${stamp}.html`);
  fs.writeFileSync(htmlFile, htmlReport(results, startedAt));
  fs.writeFileSync(path.join(OUTPUT_DIR, `query-report-${stamp}.json`), JSON.stringify({ baseUrl: BASE_URL, startedAt, specs, results }, null, 2));

  const failed = results.filter(r => r.status !== "COMPLETED");
  console.log(`\n${results.length - failed.length}/${results.length} passed. Report: ${htmlFile}`);
  process.exitCode = failed.length ? 1 : 0;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
