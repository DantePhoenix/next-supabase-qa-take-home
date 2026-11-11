import { test, expect } from "../fixtures/test";
import type { ExplorerPage } from "../pages/ExplorerPage";
import { COL, TOTAL_SUMMARY } from "../support/constants";

// Search and wait for the summary to change from the unfiltered total.
async function searchAndWait(app: ExplorerPage, text: string) {
  await app.search.fill(text);
  await expect(app.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
  await app.waitForResults();
}

test.describe("Search", () => {
  test.describe("by text", () => {
    test("by country returns only rows from that country", async ({
      explorer,
    }) => {
      await searchAndWait(explorer, "Japan");

      const countries = await explorer.table.columnTexts(COL.country);
      expect(countries.length).toBeGreaterThan(0);
      for (const c of countries) {
        expect(c.toLowerCase()).toContain("japan");
      }
    });

    test("by occupation matches the occupation column", async ({
      explorer,
    }) => {
      // A real occupation taken from the first row is used to avoid depending on the seed data.
      const occupation = await explorer.table.firstCellText(COL.occupation);

      await explorer.search.fill(occupation);
      await explorer.waitForResults();

      const occupations = await explorer.table.columnTexts(COL.occupation);
      expect(occupations.length).toBeGreaterThan(0);
      for (const o of occupations) {
        expect(o.toLowerCase()).toContain(occupation.toLowerCase());
      }
    });

    test("a partial match also returns results", async ({ explorer }) => {
      await searchAndWait(explorer, "apan");

      const countries = await explorer.table.columnTexts(COL.country);
      expect(countries.length).toBeGreaterThan(0);
      for (const c of countries) {
        expect(c.toLowerCase()).toContain("apan");
      }
    });
  });

  test.describe("by ID", () => {
    test("an integer matches the record with that ID", async ({ explorer }) => {
      await explorer.search.fill("42");
      await explorer.waitForResults();
      await expect(explorer.table.rowById(42)).toBeVisible();
    });
  });

  test.describe("case insensitivity", () => {
    test("lowercase and uppercase queries give the same summary", async ({
      explorer,
    }) => {
      await searchAndWait(explorer, "japan");
      const lower = await explorer.pagination.summary.innerText();

      await explorer.search.fill("JAPAN");
      await explorer.waitForResults();
      await expect(explorer.pagination.summary).toHaveText(lower);
    });
  });

  test.describe("no results", () => {
    test("shows the empty state", async ({ explorer }) => {
      await explorer.search.fill("zzzz-no-match-qqqq");
      await expect(explorer.table.emptyState).toBeVisible();
      await expect(explorer.table.emptyState).toHaveText(
        "No records match your search and filters.",
      );
      await expect(explorer.table.rows).toHaveCount(0);
    });
  });

  test.describe("clearing the search", () => {
    test("restores all 10,000 records", async ({ explorer }) => {
      await searchAndWait(explorer, "Japan");

      await explorer.search.clear();
      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      await expect(explorer.table.rows).toHaveCount(25);
    });

    test("after an empty state, the table is shown again", async ({
      explorer,
    }) => {
      await explorer.search.fill("zzzz-no-match-qqqq");
      await expect(explorer.table.emptyState).toBeVisible();

      await explorer.search.clear();
      await expect(explorer.table.emptyState).toBeHidden();
      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
    });
  });
});
