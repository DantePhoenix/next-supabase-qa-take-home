import type { Page } from "@playwright/test";
import { Filters } from "./components/Filters";
import { LoadingState } from "./components/LoadingState";
import { Pagination } from "./components/Pagination";
import { ResultsTable } from "./components/ResultsTable";
import { SearchBox } from "./components/SearchBox";

/**
 * Single page "Coffee & Health Explorer".
 * It has no locators of its own: it composes the components and exposes the
 * cross-cutting concerns (navigation, waiting for results, URL, view snapshot).
 */
export class ExplorerPage {
  readonly search: SearchBox;
  readonly filters: Filters;
  readonly table: ResultsTable;
  readonly loading: LoadingState;
  readonly pagination: Pagination;

  constructor(readonly page: Page) {
    this.search = new SearchBox(page);
    this.filters = new Filters(page);
    this.table = new ResultsTable(page);
    this.loading = new LoadingState(page);
    this.pagination = new Pagination(page, this.loading);
  }

  /** Accepts a path ("/") or an absolute URL (shared links). */
  async goto(path = "/") {
    await this.page.goto(path);
  }

  async reload() {
    await this.page.reload();
  }

  /** Wait until there is no loading indicator and no aria-busy element. */
  async waitForResults() {
    await this.loading.waitUntilIdle();
  }

  url(): string {
    return this.page.url();
  }

  /** Current query string (includes the "?"). */
  urlSearch(): string {
    return new URL(this.page.url()).search;
  }

  /** Current query-string parameters. */
  urlParams(): URLSearchParams {
    return new URL(this.page.url()).searchParams;
  }

  /**
   * Values of all query-string parameters. Lets tests check for an EXACT value
   * (e.g. "Japan", "60") without depending on the parameter names.
   */
  urlParamValues(): string[] {
    return [...this.urlParams().values()];
  }

  /**
   * Snapshot of the visible state, to compare before and after reloading
   * or opening a shared link.
   */
  async snapshot() {
    return {
      summary: (await this.pagination.summary.innerText()).trim(),
      indicator: (await this.pagination.indicator.innerText()).trim(),
      ids: await this.table.rowIds(),
      search: await this.search.input.inputValue(),
      ageMin: await this.filters.age.min.inputValue(),
      ageMax: await this.filters.age.max.inputValue(),
      coffeeMax: await this.filters.coffee.max.inputValue(),
      resetEnabled: await this.filters.reset.isEnabled(),
    };
  }
}
