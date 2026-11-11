import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../support/constants";
import { parseIndicator, parseSummary } from "../../support/parsers";
import { chooseOption } from "../../support/select";
import type { LoadingState } from "./LoadingState";

/**
 * Pagination: buttons, page size, "Page N of M" indicator and
 * "Showing X–Y of Z records" summary.
 *
 * The goXxx() and setPageSize() methods wait for the load to complete.
 * If a test needs to observe the loading state, it uses the locators
 * directly (e.g. pagination.next.click()), which do NOT wait.
 */
export class Pagination {
  readonly first: Locator;
  readonly prev: Locator;
  readonly next: Locator;
  readonly last: Locator;
  readonly pageSize: Locator;
  readonly indicator: Locator;
  readonly summary: Locator;

  constructor(
    private readonly page: Page,
    private readonly loading: LoadingState,
  ) {
    this.first = page.getByTestId(TEST_IDS.first);
    this.prev = page.getByTestId(TEST_IDS.prev);
    this.next = page.getByTestId(TEST_IDS.next);
    this.last = page.getByTestId(TEST_IDS.last);
    this.pageSize = page.getByTestId(TEST_IDS.pageSize);
    this.indicator = page.getByTestId(TEST_IDS.indicator);
    this.summary = page.getByTestId(TEST_IDS.summary);
  }

  /** The four navigation buttons. */
  get buttons(): Locator[] {
    return [this.first, this.prev, this.next, this.last];
  }

  async goNext() {
    await this.next.click();
    await this.loading.waitUntilIdle();
  }

  async goPrev() {
    await this.prev.click();
    await this.loading.waitUntilIdle();
  }

  async goFirst() {
    await this.first.click();
    await this.loading.waitUntilIdle();
  }

  async goLast() {
    await this.last.click();
    await this.loading.waitUntilIdle();
  }

  /** Choose the page size WITHOUT waiting for it to load. */
  async selectPageSize(size: number) {
    await chooseOption(this.page, TEST_IDS.pageSize, String(size));
  }

  /** Choose the page size and wait for the load to complete. */
  async setPageSize(size: number) {
    await this.selectPageSize(size);
    await this.loading.waitUntilIdle();
  }

  /** { from, to, total } read from "Showing X–Y of Z records". */
  async readSummary() {
    return parseSummary(await this.summary.innerText());
  }

  /** { current, pages } read from "Page N of M". */
  async readIndicator() {
    return parseIndicator(await this.indicator.innerText());
  }
}
