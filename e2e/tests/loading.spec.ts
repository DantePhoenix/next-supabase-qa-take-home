import { test, expect } from "../fixtures/test";
import type { ExplorerPage } from "../pages/ExplorerPage";
import { TOTAL_SUMMARY } from "../support/constants";
import { holdApi } from "../support/network";

/* ------------------------- State Assertions --------------------------- */

// Everything that must hold while a request is pending.
async function expectLoadingState(app: ExplorerPage) {
  await expect(app.loading.indicator).toBeVisible();
  await expect(app.loading.indicator).toContainText("Loading");
  await expect(app.loading.busy).toBeVisible();
  for (const button of app.pagination.buttons) {
    await expect(button).toBeDisabled();
  }
}

// Everything that must hold once the response has arrived.
async function expectReadyState(app: ExplorerPage) {
  await app.waitForResults();
  await expect(app.loading.indicator).toBeHidden();
  await expect(app.loading.allBusy).toHaveCount(0);
}

/* --------------------------------- Tests ---------------------------------- */

test.describe("Loading states", () => {
  test.describe("loading indicator on every data request", () => {
    test.beforeEach(async ({ explorer }) => {
      await expectReadyState(explorer);
    });

    const triggers: {
      name: string;
      run: (app: ExplorerPage) => Promise<void>;
    }[] = [
      {
        name: "searching",
        run: (app) => app.search.fill("Japan"),
      },
      {
        name: "changing a select filter",
        run: async (app) => {
          const gender = await app.table.firstCellText("gender");
          await app.filters.chooseGender(gender);
        },
      },
      {
        name: "changing the country filter",
        run: async (app) => {
          const country = await app.table.firstCellText("country");
          await app.filters.country.select([country]);
        },
      },
      {
        name: "changing a numeric filter",
        run: (app) => app.filters.age.min.fill("30"),
      },
      {
        name: "going to the next page",
        run: (app) => app.pagination.next.click(),
      },
      {
        name: "going to the last page",
        run: (app) => app.pagination.last.click(),
      },
      {
        name: "changing rows per page",
        run: (app) => app.pagination.selectPageSize(50),
      },
    ];

    for (const t of triggers) {
      test(`${t.name}: shows "Loading…", sets aria-busy and disables pagination, then clears`, async ({
        explorer,
      }) => {
        const api = await holdApi(explorer.page);

        await t.run(explorer);
        await expectLoadingState(explorer);

        api.release();
        await expectReadyState(explorer);
        // Once finished, the summary no longer shows the loading text.
        await expect(explorer.pagination.summary).not.toHaveText(/Loading/);
      });
    }

    test("Reset filters: shows the loading state, then restores the full list", async ({
      explorer,
    }) => {
      await explorer.filters.age.min.fill("30");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await expectReadyState(explorer);

      const api = await holdApi(explorer.page);
      await explorer.filters.reset.click();
      await expectLoadingState(explorer);

      api.release();
      await expectReadyState(explorer);
      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
    });

    test("the table is dimmed while loading and back to normal afterwards", async ({
      explorer,
    }) => {
      const api = await holdApi(explorer.page);
      await explorer.pagination.next.click();
      await expect(explorer.loading.busy).toBeVisible();

      const effectiveOpacity = () =>
        explorer.loading.firstRowEffectiveOpacity();

      await expect.poll(effectiveOpacity).toBeLessThan(1);

      api.release();
      await expectReadyState(explorer);
      await expect.poll(effectiveOpacity).toBe(1);
    });

    test("the table keeps its rows (dimmed) while loading instead of being replaced", async ({
      explorer,
    }) => {
      const api = await holdApi(explorer.page);
      await explorer.pagination.next.click();
      await expectLoadingState(explorer);

      // The previous rows remain visible and no empty state appears.
      await expect(explorer.table.rows).toHaveCount(25);
      await expect(explorer.table.emptyState).toBeHidden();

      api.release();
      await expectReadyState(explorer);
      await expect(explorer.pagination.summary).toHaveText(
        "Showing 26–50 of 10,000 records",
      );
    });

    test("pagination buttons cannot be used while loading (no double navigation)", async ({
      explorer,
    }) => {
      const api = await holdApi(explorer.page);
      await explorer.pagination.next.click();
      await expectLoadingState(explorer);

      // force: attempts to press even if disabled; should not change pages.
      await explorer.pagination.next.click({ force: true });

      api.release();
      await expectReadyState(explorer);
      await expect(explorer.pagination.summary).toHaveText(
        "Showing 26–50 of 10,000 records",
      );
    });
  });
});
