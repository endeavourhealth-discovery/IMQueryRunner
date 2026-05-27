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
  await pw.page.locator(".p-datatable-header").filter({ hasText: total });
  await pw.page.waitForTimeout(2000);
});
