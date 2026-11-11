import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_IDS } from "../../support/constants";

/**
 * App loading state: "Loading…" indicator, aria-busy, and dimmed table.
 * Only the WAIT (waitUntilIdle) lives here; loading-state assertions stay in the tests.
 */
export class LoadingState {
  readonly indicator: Locator;
  /** First element marked aria-busy="true" (to check that it exists). */
  readonly busy: Locator;
  /** All elements aria-busy="true" (to check that none remain). */
  readonly allBusy: Locator;

  constructor(private readonly page: Page) {
    this.indicator = page.getByTestId(TEST_IDS.loading);
    this.allBusy = page.locator('[aria-busy="true"]');
    this.busy = this.allBusy.first();
  }

  /** Wait for loading to finish: no indicator and no aria-busy. */
  async waitUntilIdle() {
    await expect(this.indicator).toBeHidden();
    await expect(this.allBusy).toHaveCount(0);
  }

  /**
   * Effective opacity of the first row: the product of the opacity of the row
   * and all its ancestors, so dimming is detected wherever it is applied.
   */
  async firstRowEffectiveOpacity(): Promise<number> {
    return this.page
      .getByTestId(TEST_IDS.row)
      .first()
      .evaluate((el) => {
        let node: HTMLElement | null = el as HTMLElement;
        let o = 1;
        while (node) {
          o *= parseFloat(getComputedStyle(node).opacity);
          node = node.parentElement;
        }
        return o;
      });
  }
}
