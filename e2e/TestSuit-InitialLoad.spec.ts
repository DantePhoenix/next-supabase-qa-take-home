import { test, expect, Page } from "@playwright/test";

const TOTAL_SUMMARY = "Showing 1–25 of 10,000 records";

// Keeps the API request "in flight" until calling release(),
// to observe the loading status without depending on timing.
async function holdApi(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/records*", async (route) => {
    await gate;
    await route.continue();
  });
  return { release: () => release() };
}

test.describe("Initial load", () => {
  test("shows 25 rows and the full summary", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("result-row")).toHaveCount(25);
    await expect(page.getByTestId("results-summary")).toHaveText(TOTAL_SUMMARY);
  });

});
