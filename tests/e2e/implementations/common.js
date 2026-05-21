/* globals gauge */

const { chromium } = require("@playwright/test");
const { pw } = require("./playwright");
const path = require("path");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
let currentSpec, currentScenario;

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

  pw.page.locator("button").filter({ hasText: "cypress" }).click();

  await pw.page.waitForTimeout(5000);
  await pw.page.waitForSelector('[data-testid="accept-all-cookies"]', { state: "visible" });
  await pw.page.click('[data-testid="accept-all-cookies"]');
  //await pw.page.waitForSelector('[data-testid="accept-all-cookies"]', { state: "hidden" });
});

step("Goto route <route>", async route => {
  await pw.page.goto(`${process.env.BASE_URL || "http://localhost:8082"}${route}`);
});

step("Click logo to return to homepage", async () => {
  await pw.page.locator('[data-testid="im-logo"]').click();
  await pw.page.waitForSelector("#shortcuts-container");
});

step("Click <text> button", async text => {
  await pw.page.getByRole("button", { name: text }).click();
  await pw.page.waitForLoadState("networkidle");
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
  await pw.page.waitForTimeout(3000);
  await pw.page.locator(".p-listbox-option").filter({ hasText: text }).click();
  await pw.page.waitForTimeout(2000);
});

step("Wait", async () => {
  await pw.page.waitForTimeout(4000);
});
