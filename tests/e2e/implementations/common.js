/* globals gauge */

const { chromium, expect } = require("@playwright/test");
const { pw } = require("./playwright");
const path = require("path");
const assert = require("node:assert");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Must stay below gauge's per-step test_timeout (40000ms in env/default)
const JOB_TIMEOUT = Number.parseInt(process.env.job_timeout || "35000");
let currentSpec, currentScenario;

function isJobAddResponse(response) {
  return response.request().method() === "POST" && response.url().includes("/api/queue/job/add");
}

function toJob(response) {
  return response
    .json()
    .catch(() => null)
    .then(body => ({ id: body && body.jobId, name: (response.request().postDataJSON() || {}).jobName, status: response.status() }));
}

gauge.customScreenshotWriter = async function () {
  const screenshotFilePath = path.join(process.env["gauge_screenshots_dir"], `${currentSpec.name}-${currentScenario.name}.png`);
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
  pw.job = null;
  pw.page.on("response", response => {
    if (isJobAddResponse(response)) pw.job = toJob(response);
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
  await pw.page.waitForLoadState("networkidle");
  await pw.page.waitForSelector("#search-results-main-container >> tr");
});

step("Select <text> result", async text => {
  const node = pw.page.locator("#search-results-main-container >> tr").filter({ hasText: text }).first();
  await node.waitFor({ state: "visible" });
  await node.click();
  await pw.page.waitForSelector(".back-to-search", { state: "visible" });
  await pw.page.waitForLoadState("networkidle");
});

step("Click dialog confirm", async () => {
  await pw.page.locator(".p-confirmdialog").locator(".p-confirmdialog-accept-button").click();
});

step("Search for <text> and select", async text => {
  await pw.page.waitForSelector("#autocomplete-search", { state: "visible" });
  await pw.page.locator("#autocomplete-search").nth(0).fill(text);
  await pw.page.locator(".p-listbox-option").filter({ hasText: text }).click();
  await pw.page.waitForTimeout(2000);
});

step("Search for <search> and select <select>", async (search, select) => {
  await pw.page.waitForSelector("#autocomplete-search", { state: "visible" });
  await pw.page.locator("#autocomplete-search").nth(0).fill(search);
  await pw.page.locator(".p-listbox-option").filter({ hasText: select }).click();
  await pw.page.waitForTimeout(2000);
});

step("Wait <time> seconds", async time => {
  await pw.page.waitForTimeout(Number.parseInt(time) * 1000);
});

step("Wait for job to complete", async () => {
  const deadline = Date.now() + JOB_TIMEOUT;
  // "Click <text> button" returns before the add request completes (networkidle is a page-load state,
  // already reached in the SPA), so wait for the response if the listener hasn't seen it yet
  const job = await (pw.job ||
    pw.page
      .waitForResponse(isJobAddResponse, { timeout: 15000 })
      .then(toJob)
      .catch(() => null));
  assert.ok(job, "No job was queued in this scenario");
  assert.ok(job.id, `Queueing job "${job.name}" returned no jobId (HTTP ${job.status}); check the RabbitMQ connection`);
  let status;
  while (Date.now() < deadline) {
    const response = await pw.page.request.get(`${BASE_URL}/api/queue/job/${job.id}`);
    status = (await response.json()).status;
    if (["COMPLETED", "ERRORED", "CANCELLED"].includes(status)) {
      console.log(`Job ${job.id} "${job.name}" finished with status ${status}`);
      return;
    }
    await pw.page.waitForTimeout(1000);
  }
  assert.fail(`Job ${job.id} still "${status}" after ${JOB_TIMEOUT}ms`);
});

step("Wait for datatable to finish loading", async () => {
  const loading = pw.page.locator(".p-datatable-loading-icon");
  await expect(loading).toBeHidden({ timeout: 30000 });
  await expect(pw.page.locator(".p-datatable")).toBeVisible();
});
