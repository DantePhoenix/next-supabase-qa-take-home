import { test, expect } from "../fixtures/test";
import type { ExplorerPage } from "../pages/ExplorerPage";
import {
  COL,
  PAGE_SIZES,
  TOTAL_RECORDS,
  TOTAL_SUMMARY,
} from "../support/constants";

test.describe("Pagination", () => {
  test.describe("moving between pages", () => {
    test("Next shows rows 26–50, updates summary and indicator", async ({
      explorer,
    }) => {
      await explorer.pagination.goNext();

      await expect(explorer.pagination.summary).toHaveText(
        "Showing 26–50 of 10,000 records",
      );
      expect(await explorer.pagination.readIndicator()).toEqual({
        current: 2,
        pages: 400,
      });
      await expect(explorer.table.rows).toHaveCount(25);
      expect(await explorer.table.rowIds()).toEqual(
        Array.from({ length: 25 }, (_, i) => 26 + i),
      );
    });

    test("Previous goes back to the previous page", async ({ explorer }) => {
      await explorer.pagination.goNext();
      await explorer.pagination.goPrev();

      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      expect((await explorer.pagination.readIndicator()).current).toBe(1);
      expect((await explorer.table.rowIds())[0]).toBe(1);
    });

    test("consecutive pages do not repeat or skip records", async ({
      explorer,
    }) => {
      const p1 = await explorer.table.rowIds();
      await explorer.pagination.goNext();
      const p2 = await explorer.table.rowIds();
      await explorer.pagination.goNext();
      const p3 = await explorer.table.rowIds();

      const all = [...p1, ...p2, ...p3];
      expect(new Set(all).size).toBe(all.length);
      expect(all).toEqual(Array.from({ length: 75 }, (_, i) => i + 1));
    });

    test("rows stay sorted by ID ascending on later pages", async ({
      explorer,
    }) => {
      await explorer.pagination.goNext();
      await explorer.pagination.goNext();
      const ids = await explorer.table.rowIds();
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });
  });

  test.describe("first and last page", () => {
    test("on page 1, First and Previous are disabled; Next and Last enabled", async ({
      explorer,
    }) => {
      const { first, prev, next, last } = explorer.pagination;
      await expect(first).toBeDisabled();
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();
      await expect(last).toBeEnabled();
      expect(await explorer.pagination.readIndicator()).toEqual({
        current: 1,
        pages: 400,
      });
    });

    test("Last goes to page 400 with the final 25 records", async ({
      explorer,
    }) => {
      await explorer.pagination.goLast();

      expect(await explorer.pagination.readIndicator()).toEqual({
        current: 400,
        pages: 400,
      });
      await expect(explorer.pagination.summary).toHaveText(
        "Showing 9,976–10,000 of 10,000 records",
      );
      await expect(explorer.table.rows).toHaveCount(25);
      const ids = await explorer.table.rowIds();
      expect(ids[0]).toBe(9976);
      expect(ids[ids.length - 1]).toBe(10000);
    });

    test("on the last page, Next and Last are disabled; First and Previous enabled", async ({
      explorer,
    }) => {
      await explorer.pagination.goLast();

      const { first, prev, next, last } = explorer.pagination;
      await expect(next).toBeDisabled();
      await expect(last).toBeDisabled();
      await expect(first).toBeEnabled();
      await expect(prev).toBeEnabled();
    });

    test("First returns to page 1 from the last page", async ({ explorer }) => {
      await explorer.pagination.goLast();
      await explorer.pagination.goFirst();

      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      expect((await explorer.pagination.readIndicator()).current).toBe(1);
    });

    test("with a single page of results, all four buttons are disabled", async ({
      explorer,
    }) => {
      // One result only: search by ID.
      await explorer.search.fill("42");
      await expect(explorer.table.rows).toHaveCount(1);
      await explorer.waitForResults();

      expect(await explorer.pagination.readIndicator()).toEqual({
        current: 1,
        pages: 1,
      });
      for (const button of explorer.pagination.buttons) {
        await expect(button).toBeDisabled();
      }
    });
  });

  test.describe("rows per page", () => {
    for (const size of PAGE_SIZES) {
      test(`${size} per page: row count, summary and total pages`, async ({
        explorer,
      }) => {
        await explorer.pagination.setPageSize(size);

        await expect(explorer.table.rows).toHaveCount(size);
        await expect(explorer.pagination.summary).toHaveText(
          `Showing 1–${size} of 10,000 records`,
        );
        expect(await explorer.pagination.readIndicator()).toEqual({
          current: 1,
          pages: TOTAL_RECORDS / size,
        });
      });
    }

    test("changing page size returns to page 1", async ({ explorer }) => {
      await explorer.pagination.goNext();
      await explorer.pagination.goNext();
      expect((await explorer.pagination.readIndicator()).current).toBe(3);

      await explorer.pagination.setPageSize(50);

      expect((await explorer.pagination.readIndicator()).current).toBe(1);
      await expect(explorer.pagination.summary).toHaveText(
        "Showing 1–50 of 10,000 records",
      );
      expect((await explorer.table.rowIds())[0]).toBe(1);
    });

    test("last page with 100 per page shows records 9,901–10,000", async ({
      explorer,
    }) => {
      await explorer.pagination.setPageSize(100);
      await explorer.pagination.goLast();

      await expect(explorer.pagination.summary).toHaveText(
        "Showing 9,901–10,000 of 10,000 records",
      );
      expect((await explorer.pagination.readIndicator()).current).toBe(100);
    });
  });

  test.describe("summary and indicator stay consistent with the filtered total", () => {
    // Covers totals that are NOT a multiple of the page size.
    // KNOWN FAILURE: BUG-001 (the app shows one page fewer). See TESTING.md, section 5.
    for (const size of PAGE_SIZES) {
      test(`filtered results, ${size} per page: pages = ceil(total / size) and last page has the remainder [BUG-001]`, async ({
        explorer,
      }) => {
        await explorer.pagination.setPageSize(size);
        await explorer.filters.age.min.fill("47");
        await explorer.waitForResults();

        const { total } = await explorer.pagination.readSummary();
        expect(total).toBeGreaterThan(0);
        expect(total).toBeLessThan(TOTAL_RECORDS);

        const expectedPages = Math.ceil(total / size);
        expect((await explorer.pagination.readIndicator()).pages).toBe(
          expectedPages,
        );

        await explorer.pagination.goLast();

        const expectedLast = total - (expectedPages - 1) * size;
        const s = await explorer.pagination.readSummary();
        expect(s.from).toBe((expectedPages - 1) * size + 1);
        expect(s.to).toBe(total);
        expect(s.total).toBe(total);
        await expect(explorer.table.rows).toHaveCount(expectedLast);
        await expect(explorer.pagination.next).toBeDisabled();
      });
    }

    // KNOWN FAILURE: BUG-001 (records on the missing last page are unreachable).
    test("every matching record is reachable: walking all pages yields each ID exactly once [BUG-001]", async ({
      explorer,
    }) => {
      test.slow();
      await explorer.pagination.setPageSize(100);

      // Filter by country to get a few hundred records.
      const country = await explorer.table.firstCellText(COL.country);
      await explorer.filters.country.select([country]);
      await explorer.waitForResults();

      const { total } = await explorer.pagination.readSummary();
      const { pages } = await explorer.pagination.readIndicator();
      expect(pages).toBe(Math.ceil(total / 100));

      const seen: number[] = [...(await explorer.table.rowIds())];
      for (let p = 2; p <= pages; p++) {
        await explorer.pagination.goNext();
        seen.push(...(await explorer.table.rowIds()));
      }

      expect(seen.length).toBe(total);
      expect(new Set(seen).size).toBe(total);
      await expect(explorer.pagination.next).toBeDisabled();
    });
  });

  test.describe("page reset", () => {
    async function goToPage3(explorer: ExplorerPage) {
      await explorer.pagination.goNext();
      await explorer.pagination.goNext();
      expect((await explorer.pagination.readIndicator()).current).toBe(3);
    }

    test("changing a numeric filter returns to page 1", async ({
      explorer,
    }) => {
      await goToPage3(explorer);

      await explorer.filters.age.min.fill("30");
      await explorer.waitForResults();

      expect((await explorer.pagination.readIndicator()).current).toBe(1);
      expect((await explorer.pagination.readSummary()).from).toBe(1);
    });

    test("changing a select filter returns to page 1", async ({ explorer }) => {
      await goToPage3(explorer);

      const gender = await explorer.table.firstCellText(COL.gender);
      await explorer.filters.chooseGender(gender);
      await explorer.waitForResults();

      expect((await explorer.pagination.readIndicator()).current).toBe(1);
      expect((await explorer.pagination.readSummary()).from).toBe(1);
    });

    test("changing the country filter returns to page 1", async ({
      explorer,
    }) => {
      await goToPage3(explorer);

      const country = await explorer.table.firstCellText(COL.country);
      await explorer.filters.country.select([country]);
      await explorer.waitForResults();

      expect((await explorer.pagination.readIndicator()).current).toBe(1);
    });

    test("changing the search returns to page 1", async ({ explorer }) => {
      await goToPage3(explorer);

      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();

      expect((await explorer.pagination.readIndicator()).current).toBe(1);
      expect((await explorer.pagination.readSummary()).from).toBe(1);
    });
  });

  // The loading state of the pagination buttons is covered in loading.spec.ts
  // (deterministic, using holdApi).
});
