import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../support/constants";

/** Results table: rows, cells per column, empty state, error message and skeleton. */
export class ResultsTable {
  readonly rows: Locator;
  readonly emptyState: Locator;
  /**
   * Error message shown in place of the table when the API fails.
   * Located by text because the error box has no known data-testid;
   * adjust it here if a testid is added.
   */
  readonly errorMessage: Locator;
  /** If the skeleton uses a different data-testid, it will only be adjusted here. */
  readonly skeletons: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByTestId(TEST_IDS.row);
    this.emptyState = page.getByTestId(TEST_IDS.emptyState);
    this.errorMessage = page.getByText(
      /Something went wrong while loading records/,
    );
    this.skeletons = page.locator('[data-testid*="skeleton"]');
  }

  /** All cells in a column (data-col) on the current page. */
  column(col: string): Locator {
    return this.page.locator(
      `[data-testid="${TEST_IDS.row}"] [data-col="${col}"]`,
    );
  }

  /** Cell in a column at row number `index` (0-based). */
  cell(index: number, col: string): Locator {
    return this.rows.nth(index).locator(`[data-col="${col}"]`);
  }

  /** Row with a specific ID (data-row-id). */
  rowById(id: number | string): Locator {
    return this.page.locator(
      `[data-testid="${TEST_IDS.row}"][data-row-id="${id}"]`,
    );
  }

  /** Text (without extra spaces) of the first cell in the column. */
  async firstCellText(col: string): Promise<string> {
    return (await this.column(col).first().innerText()).trim();
  }

  /** Text (without extra spaces) from all cells in the column. */
  async columnTexts(col: string): Promise<string[]> {
    return (await this.column(col).allTextContents()).map((t) => t.trim());
  }

  /** IDs (data-row-id) of the visible rows, in order. */
  async rowIds(): Promise<number[]> {
    const ids = await this.rows.evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-row-id")),
    );
    return ids.map(Number);
  }
}
