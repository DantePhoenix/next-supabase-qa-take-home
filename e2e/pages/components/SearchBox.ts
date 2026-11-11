import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../support/constants";

/** Free text search box. */
export class SearchBox {
  readonly input: Locator;

  constructor(page: Page) {
    this.input = page.getByTestId(TEST_IDS.search);
  }

  async fill(text: string) {
    await this.input.fill(text);
  }

  async clear() {
    await this.input.fill("");
  }
}
