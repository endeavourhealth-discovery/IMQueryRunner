/* globals gauge */

const { chromium, expect } = require("@playwright/test");
const { pw } = require("./playwright");
const path = require("path");
const assert = require("node:assert");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Must stay below gauge's per-step test_timeout (40000ms in env/default)
const SUBMIT_TIMEOUT = Number.parseInt(process.env.submit_timeout || "35000");
const JOB_TIMEOUT = Number.parseInt(process.env.job_timeout || "35000");
let currentSpec, currentScenario;

function isJobAddResponse(response) {
  return response.request().method() === "POST" && response.url().includes("/api/queue/job/add");
}

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(message)), ms)));
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function toJob(response) {
  return response
    .json()
    .catch(() => null)
    .then(body => ({ id: body && body.jobId, name: (response.request().postDataJSON() || {}).jobName, status: response.status() }));
}

// Pins $searchDate so expected counts don't drift with the day the specs run; the date picker emits the argument as it is typed
async function setSearchDate() {
  const searchDate = (process.env.search_date || "").trim();
  if (!searchDate) return;
  const input = pw.page.locator('input[data-testid="search-date-input"], [data-testid="search-date-input"] input').first();
  await input.fill(searchDate);
  await input.press("Escape");
  await expect(input).toHaveValue(searchDate);
}

function toFileName(text) {
  return text.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
}

// Rows of a table-driven scenario share its name, so the selected query and a timestamp keep each row's screenshot separate
gauge.customScreenshotWriter = async function () {
  const name = [currentSpec.name, currentScenario.name, pw.screenshotLabel, Date.now()].filter(Boolean).join("-");
  const screenshotFilePath = path.join(process.env["gauge_screenshots_dir"], `${toFileName(name)}.png`);
  await pw.page.screenshot({ path: screenshotFilePath });
  return screenshotFilePath;
};

beforeSpec(async context => {
  currentSpec = context.currentSpec;
});

beforeScenario(async context => {
  currentScenario = context.currentScenario;
  pw.browser = await chromium.launch({
    headless: process.env.headless_chrome === "true" || false
  });
  pw.context = await pw.browser.newContext();
  pw.page = await pw.context.newPage();
  pw.submittedJob = null;
  pw.screenshotLabel = null;
  pw.job = new Promise(resolve => (pw.resolveJob = resolve));
  pw.page.on("response", response => {
    if (isJobAddResponse(response)) pw.resolveJob(toJob(response));
  });
});

afterScenario(async () => {
  await pw.context.close();
  await pw.browser.close();
});

step("Open IMQueryRunner", async () => {
  await pw.page.goto(`${BASE_URL}/`);
});

step("Login", async () => {
  const username = process.env.TEST_USERNAME || "testuser";
  const password = process.env.TEST_PASSWORD || "testpass";

  await pw.page.fill('input[placeholder="username, Email or phone"]', username);
  await pw.page.fill('input[placeholder="Password"]', password);
  await pw.page.click("button >> text=Sign In");

  //dev login loop
  //pw.page.locator("button").filter({ hasText: "cypress" }).click();

  await pw.page.waitForSelector('[data-testid="accept-all-cookies"]', { state: "visible" });
  await pw.page.click('[data-testid="accept-all-cookies"]');
});

step("Goto route <route>", async route => {
  await pw.page.goto(`${process.env.BASE_URL || "http://localhost:8082"}${route}`);
});

step("Click logo to return to homepage", async () => {
  await pw.page.locator('[data-testid="im-logo"]').click();
  await pw.page.waitForSelector("#shortcuts-container");
});

step("Click <text> button", async text => {
  await pw.page.getByRole("button", { name: text, exact: true }).click();
});

step("Type <text> into <input>", async (text, input) => {
  await pw.page.getByPlaceholder(input).fill(text);
});

step("Search for <text>", async text => {
  await pw.page.waitForSelector('[data-testid="search-input"]');
  const txt = await pw.page.inputValue('[data-testid="search-input"]');
  if (txt === text) {
    pw.page.click('button >> text="Search"');
  } else {
    await pw.page.fill('[data-testid="search-input"]', text);
  }
  await pw.page.waitForSelector("#search-results-main-container >> tr");
});

step("Select <text> result", async text => {
  const node = pw.page.locator("#search-results-main-container >> tr").filter({ hasText: text }).first();
  await node.waitFor({ state: "visible" });
  await node.click();
  await pw.page.waitForSelector(".back-to-search", { state: "visible" });
});

step("Click dialog confirm", async () => {
  await pw.page.locator(".p-confirmdialog").locator(".p-confirmdialog-accept-button").click();
});

step("Search for <text> and select", async text => {
  pw.screenshotLabel = text;
  await pw.page.waitForSelector("#autocomplete-search", { state: "visible" });
  await pw.page.locator("#autocomplete-search").nth(0).fill(text);
  await pw.page.locator(".p-listbox-option").filter({ hasText: text }).click();
  await expect(pw.page.locator(".results-container")).toBeHidden();
  await expect(pw.page.locator(".p-datatable")).toBeVisible({ timeout: 30000 });
  await setSearchDate();
  await expect(pw.page.getByRole("button", { name: "Add to queue" })).toBeEnabled();
});

step("Search for <search> and select <select>", async (search, select) => {
  pw.screenshotLabel = select;
  await pw.page.waitForSelector("#autocomplete-search", { state: "visible" });
  await pw.page.locator("#autocomplete-search").nth(0).fill(search);
  await pw.page.locator(".p-listbox-option").filter({ hasText: select }).click();
  await expect(pw.page.locator(".results-container")).toBeHidden();
  await expect(pw.page.locator(".p-datatable")).toBeVisible({ timeout: 30000 });
  await setSearchDate();
  await expect(pw.page.getByRole("button", { name: "Add to queue" })).toBeEnabled();
});

step("Wait <time> seconds", async time => {
  await pw.page.waitForTimeout(Number.parseInt(time) * 1000);
});

step("Wait for job to submit", async () => {
  await pw.page.waitForSelector(".p-treetable", { state: "visible" });
  // The queue page can show its datatable before the add request has responded. Building the job calls IMAPI for each query,
  // which can be slow on the first run, so a late response is not an error here: "Wait for job to complete" keeps waiting for it
  const started = Date.now();
  pw.submittedJob = await withTimeout(pw.job, SUBMIT_TIMEOUT, "timeout").catch(() => null);
  console.log(pw.submittedJob ? `Job add responded after ${Date.now() - started}ms` : `Job add had not responded after ${SUBMIT_TIMEOUT}ms`);
});

step("Wait for job to complete", async () => {
  // Each step has its own timeout, so a slow add response gets a second full window here
  const job = pw.submittedJob || (await withTimeout(pw.job, JOB_TIMEOUT, `No job add response within ${SUBMIT_TIMEOUT + JOB_TIMEOUT}ms of clicking Run`));
  const deadline = Date.now() + JOB_TIMEOUT;
  assert.ok(job.id, `Queueing job "${job.name}" returned no jobId (HTTP ${job.status}); check the RabbitMQ connection`);
  let status;
  while (Date.now() < deadline) {
    const response = await pw.page.request.get(`${BASE_URL}/api/queue/job/${job.id}`);
    assert.ok(response.ok(), `Job ${job.id} status request failed with HTTP ${response.status()}`);
    const data = await response.json();
    status = data.status;
    if (["COMPLETED", "ERRORED", "CANCELLED"].includes(status)) {
      console.log(`Job ${job.id} "${job.name}" finished with status ${status}`);
      await pw.page.getByRole("button", { name: "Refresh", exact: true }).click();
      const loading = pw.page.locator(".p-datatable-loading-icon");
      await expect(loading).toBeHidden({ timeout: 30000 });
      await expect(pw.page.locator('[data-testid="job-table"]')).toBeVisible();
      const row = pw.page.locator("table tbody tr").filter({ hasText: job.name }).nth(0);
      await expect(row).toBeVisible();
      await expect(row.locator(".p-tag")).toContainText(status);
      return;
    }
  }
  assert.fail(`Job ${job.id} still "${status}" after ${JOB_TIMEOUT}ms`);
});

step("Wait for job table to finish loading", async () => {
  const loading = pw.page.locator(".p-datatable-loading-icon");
  await expect(loading).toBeHidden({ timeout: 30000 });
  await expect(pw.page.locator('[data-testid="job-table"]')).toBeVisible();
});
