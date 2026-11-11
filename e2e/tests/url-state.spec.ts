import { test, expect } from "../fixtures/test";
import { ExplorerPage } from "../pages/ExplorerPage";
import { COL, NEUTRAL_URL_PARAMS, TOTAL_SUMMARY } from "../support/constants";
import { buildComplexView } from "../support/flows";

test.describe("URL state", () => {
  test("default view has no query string state", async ({ explorer }) => {
    // Without search or filters nothing needs to be restored. Pagination
    // defaults (page, pageSize) are tolerated; any other parameter is not.
    const keys = [...explorer.urlParams().keys()].filter(
      (k) => !(NEUTRAL_URL_PARAMS as readonly string[]).includes(k),
    );
    expect(keys).toEqual([]);
  });

  test.describe("the URL reflects the current view", () => {
    test("search is written to the query string", async ({ explorer }) => {
      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();

      await expect.poll(() => explorer.urlParamValues()).toContain("Japan");
    });

    test("a filter is written to the query string", async ({ explorer }) => {
      await explorer.filters.age.min.fill("60");
      await explorer.waitForResults();

      await expect.poll(() => explorer.urlParamValues()).toContain("60");
    });

    test("page and rows per page are written to the query string", async ({
      explorer,
    }) => {
      await explorer.pagination.setPageSize(50);
      await expect.poll(() => explorer.urlParamValues()).toContain("50");

      const before = explorer.url();
      await explorer.pagination.goNext();
      await expect.poll(() => explorer.url()).not.toBe(before);
    });

    test("reset filters clears the state from the URL", async ({
      explorer,
    }) => {
      await explorer.search.fill("Japan");
      await explorer.filters.age.min.fill("30");
      await explorer.waitForResults();
      await expect.poll(() => explorer.urlSearch()).not.toBe("");

      await explorer.filters.reset.click();
      await explorer.waitForResults();

      const values = explorer.urlParamValues();
      expect(values).not.toContain("Japan");
      expect(values).not.toContain("30");
    });
  });

  test.describe("reloading the page", () => {
    test("restores search", async ({ explorer }) => {
      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(before.summary);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
      await expect(explorer.search.input).toHaveValue("Japan");
    });

    test("restores a numeric range", async ({ explorer }) => {
      await explorer.filters.age.set("40", "50");
      await explorer.waitForResults();
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(before.summary);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
      await expect(explorer.filters.age.min).toHaveValue("40");
      await expect(explorer.filters.age.max).toHaveValue("50");
    });

    test("restores a select filter", async ({ explorer }) => {
      const gender = await explorer.table.firstCellText(COL.gender);
      await explorer.filters.chooseGender(gender);
      await explorer.waitForResults();
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(before.summary);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
      for (const g of await explorer.table.columnTexts(COL.gender)) {
        expect(g).toBe(gender);
      }
    });

    test("restores multiple selected countries", async ({ explorer }) => {
      // A single opening of the dropdown: reads the first two options,
      // selects them by position and closes (just like in filters.spec.ts).
      const picked = await explorer.filters.country.pickFirst(2);
      await explorer.waitForResults();
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(before.summary);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
      const countries = await explorer.table.columnTexts(COL.country);
      for (const c of countries) expect(picked).toContain(c);
    });

    test("restores the current page", async ({ explorer }) => {
      await explorer.pagination.goNext();
      await explorer.pagination.goNext();
      const before = await explorer.snapshot();
      expect(before.indicator).toContain("Page 3");

      await explorer.reload();
      await expect(explorer.pagination.indicator).toHaveText(before.indicator);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
    });

    test("restores rows per page", async ({ explorer }) => {
      await explorer.pagination.setPageSize(100);
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(
        "Showing 1–100 of 10,000 records",
      );
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
      await expect(explorer.table.rows).toHaveCount(100);
    });

    test("restores a complex view (search + filters + page + page size)", async ({
      explorer,
    }) => {
      await buildComplexView(explorer);
      const before = await explorer.snapshot();

      await explorer.reload();
      await expect(explorer.pagination.summary).toHaveText(before.summary);
      await explorer.waitForResults();

      expect(await explorer.snapshot()).toEqual(before);
    });
  });

  test.describe("deep linking", () => {
    test("opening a shared URL in a fresh browser context shows the same view", async ({
      explorer,
      browser,
    }) => {
      await buildComplexView(explorer);
      const before = await explorer.snapshot();
      const sharedUrl = explorer.url();

      const context = await browser.newContext();
      const other = new ExplorerPage(await context.newPage());
      await other.goto(sharedUrl);
      await expect(other.pagination.summary).toHaveText(before.summary);
      await other.waitForResults();

      expect(await other.snapshot()).toEqual(before);
      await context.close();
    });

    test("deep link directly to a later page restores that page", async ({
      explorer,
      browser,
    }) => {
      await explorer.pagination.goNext();
      await explorer.pagination.goNext();
      const sharedUrl = explorer.url();

      const context = await browser.newContext();
      const other = new ExplorerPage(await context.newPage());
      await other.goto(sharedUrl);

      await expect(other.pagination.summary).toHaveText(
        "Showing 51–75 of 10,000 records",
      );
      await expect(other.pagination.indicator).toContainText("Page 3");
      await context.close();
    });

    test("a restored view can be changed and reset normally", async ({
      explorer,
      browser,
    }) => {
      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();
      const sharedUrl = explorer.url();

      const context = await browser.newContext();
      const other = new ExplorerPage(await context.newPage());
      await other.goto(sharedUrl);
      await other.waitForResults();
      await expect(other.filters.reset).toBeEnabled();

      await other.filters.reset.click();
      await other.waitForResults();
      await expect(other.pagination.summary).toHaveText(TOTAL_SUMMARY);
      await expect(other.search.input).toHaveValue("");
      await context.close();
    });
  });

  test.describe("after reset", () => {
    test("reloading after Reset shows the unfiltered list", async ({
      explorer,
    }) => {
      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();

      await explorer.filters.reset.click();
      await explorer.waitForResults();
      await explorer.reload();

      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      await expect(explorer.search.input).toHaveValue("");
    });
  });
});
