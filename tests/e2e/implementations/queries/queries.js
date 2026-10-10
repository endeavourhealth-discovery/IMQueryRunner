/* globals gauge */

const { expect } = require("@playwright/test");
const assert = require("node:assert");
const { pw } = require("../playwright");

async function jobRow() {
  const job = await pw.job;
  assert.ok(job && job.name, "No job was queued in this scenario");
  return pw.page
    .locator(".p-datatable-tbody > tr")
    .filter({ has: pw.page.getByRole("cell", { name: job.name, exact: true }) })
    .first();
}

const TERMINAL_STATUSES = ["COMPLETED", "ERRORED", "CANCELLED"];
// Must stay below gauge's per-step test_timeout (40000ms in env/default)
const STATUS_TIMEOUT = Number.parseInt(process.env.job_timeout || "35000");

// The queue table only updates on refresh, so keep refreshing until this job's row reaches a terminal status
async function terminalJobRow() {
  const deadline = Date.now() + STATUS_TIMEOUT;
  const row = await jobRow();
  let status;
  while (true) {
    await row.waitFor({ state: "visible" });
    status = (await row.locator(".p-tag").innerText()).trim();
    if (TERMINAL_STATUSES.includes(status) || Date.now() >= deadline) break;
    await pw.page.waitForTimeout(2000);
    await pw.page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(pw.page.locator(".p-datatable-loading-icon")).toBeHidden({ timeout: 10000 });
  }
  assert.ok(TERMINAL_STATUSES.includes(status), `Job still "${status}" in the queue after ${STATUS_TIMEOUT}ms`);
  return { row, status };
}

async function openResults() {
  const { row } = await terminalJobRow();
  await row.locator('[data-testid="view-query-results-button"]').click();
  await pw.page.locator(".p-menu-item").nth(0).click();
}

async function expectTotalResults(total) {
  await expect(pw.page.locator(".p-datatable-header"), `Expected "Total results: ${total}"`).toContainText(`Total results: ${total}`, {
    timeout: 10000
  });
}

step("Open results page", async () => {
  await openResults();
});

step("Check total results equal <total>", async total => {
  await expectTotalResults(total.trim());
});

step("Check results for <count>", async count => {
  const expectedCount = count ? count.trim() : "";
  if (expectedCount) {
    await openResults();
    await expectTotalResults(expectedCount);
    await pw.page.getByRole("button", { name: "Back to queue" }).click();
  } else {
    const { row, status: statusText } = await terminalJobRow();

    if (statusText === "ERRORED") {
      await row.locator('[data-testid="show-error-button"]').click();
      await pw.page.waitForTimeout(2000);
      assert.fail(`Query ERRORED`);
    }

    assert.strictEqual(statusText, "COMPLETED", `Expected job status "COMPLETED" but got "${statusText}"`);
  }
});
