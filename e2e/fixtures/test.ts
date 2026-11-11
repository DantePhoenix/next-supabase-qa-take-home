import { test as base, expect } from "@playwright/test";
import { ExplorerPage } from "../pages/ExplorerPage";
import { TOTAL_SUMMARY } from "../support/constants";

type Fixtures = {
  /** Page opened at "/" with initial loading already completed. */
  explorer: ExplorerPage;
  /** Page object WITHOUT navigation: for tests that need to prepare the network before the goto. */
  freshExplorer: ExplorerPage;
};

export const test = base.extend<Fixtures>({
  freshExplorer: async ({ page }, use) => {
    await use(new ExplorerPage(page));
  },

  explorer: async ({ page }, use) => {
    const explorer = new ExplorerPage(page);
    await explorer.goto();
    await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
    await use(explorer);
  },
});

export { expect };
