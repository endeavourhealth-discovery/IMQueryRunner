/* globals gauge */

const { expect } = require("@playwright/test");
const assert = require("node:assert");
const { pw } = require("../playwright");

step("Open results page", async () => {
  await pw.page.waitForTimeout(1000);
  await pw.page.locator('[data-p-index="0"]').locator('[data-testid="view-query-results-button"]').click();
  await pw.page.waitForSelector(".p-menu-item", { state: "visible" });
  await pw.page.locator(".p-menu-item").nth(0).click();
  await pw.page.waitForTimeout(2000);
});

step("Check total results equal <total>", async total => {
  const expectedTotal = total.trim();
  await pw.page.waitForTimeout(2000);
  const headerText = (await pw.page.locator(".p-datatable-header").innerText()).trim();
  assert.ok(headerText.includes(`Total results: ${expectedTotal}`), `Expected "Total results: ${expectedTotal}" but got "${headerText}"`);
});

step("Check results for <count>", async count => {
  const expectedCount = count ? count.trim() : "";
  if (expectedCount) {
    await pw.page.waitForTimeout(1000);
    await pw.page.locator('[data-p-index="0"]').locator('[data-testid="view-query-results-button"]').click();
    await pw.page.waitForSelector(".p-menu-item", { state: "visible" });
    await pw.page.locator(".p-menu-item").nth(0).click();
    await pw.page.waitForTimeout(2000);

    const headerText = (await pw.page.locator(".p-datatable-header").innerText()).trim();
    assert.ok(headerText.includes(`Total results: ${expectedCount}`), `Expected "Total results: ${expectedCount}" but got "${headerText}"`);

    await pw.page.getByRole("button", { name: "Back to queue" }).click();
  } else {
    const waits = [0, 10000, 20000];
    let statusText;

    for (let i = 0; i < waits.length; i++) {
      if (waits[i]) {
        await pw.page.waitForTimeout(waits[i]);
      }

      statusText = (await pw.page.locator('[data-p-index="0"]').locator(".p-tag").innerText()).trim();

      if (statusText === "COMPLETED") {
        return;
      }

      if (statusText !== "RUNNING") {
        assert.fail(`Expected job status "COMPLETED" but got "${statusText}"`);
      }
    }

    assert.fail(`Expected job status "COMPLETED" but job was still "RUNNING" after retries`);
  }
});
