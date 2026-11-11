import { test, expect } from "../fixtures/test";
import { TOTAL_SUMMARY } from "../support/constants";
import { holdApi } from "../support/network";

test.describe("Initial load", () => {
  test("shows 25 rows and the full summary", async ({ freshExplorer: app }) => {
    await app.goto();

    await expect(app.table.rows).toHaveCount(25);
    await expect(app.pagination.summary).toHaveText(TOTAL_SUMMARY);
  });

  test("rows are ordered by ID ascending, starting at 1", async ({
    freshExplorer: app,
  }) => {
    await app.goto();
    await expect(app.table.rows).toHaveCount(25);

    const ids = await app.table.rowIds();

    expect(ids).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  test("shows skeleton rows and 'Loading records…' until the data arrives", async ({
    freshExplorer: app,
  }) => {
    const api = await holdApi(app.page);
    await app.goto();

    await expect(app.pagination.summary).toHaveText("Loading records…");
    await expect(app.table.skeletons.first()).toBeVisible();
    await expect(app.table.rows).toHaveCount(0);

    api.release();

    await expect(app.table.rows).toHaveCount(25);
    await expect(app.pagination.summary).toHaveText(TOTAL_SUMMARY);
    await expect(app.table.skeletons).toHaveCount(0);
  });

  test("the table is ready to use once loaded: no loading or busy state", async ({
    freshExplorer: app,
  }) => {
    await app.goto();
    await expect(app.pagination.summary).toHaveText(TOTAL_SUMMARY);

    await expect(app.loading.indicator).toBeHidden();
    await expect(app.loading.allBusy).toHaveCount(0);
    await expect(app.pagination.next).toBeEnabled();
  });
});
