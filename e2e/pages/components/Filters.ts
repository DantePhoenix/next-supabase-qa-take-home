import type { Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../../support/constants";
import { chooseOption } from "../../support/select";

/** Minimum/maximum field pair (age, coffee consumption). */
export class RangeFilter {
  readonly min: Locator;
  readonly max: Locator;

  constructor(page: Page, minTestId: string, maxTestId: string) {
    this.min = page.getByTestId(minTestId);
    this.max = page.getByTestId(maxTestId);
  }

  /** Fill in the minimum first, then the maximum. */
  async set(min: string | number, max: string | number) {
    await this.min.fill(String(min));
    await this.max.fill(String(max));
  }
}

/** Country filter: multiple selection with dropdown menu. */
export class CountryFilter {
  readonly trigger: Locator;
  readonly options: Locator;

  constructor(private readonly page: Page) {
    this.trigger = page.getByTestId(TEST_IDS.countryTrigger);
    this.options = page.locator(
      `[data-testid^="${TEST_IDS.countryOptionPrefix}"]`,
    );
  }

  async open() {
    await this.trigger.click();
  }

  async close() {
    await this.page.keyboard.press("Escape");
  }

  /** Select the given countries (open, click each one, close). */
  async select(countries: string[]) {
    await this.open();
    for (const c of countries) {
      await this.page
        .getByTestId(`${TEST_IDS.countryOptionPrefix}${c}`)
        .click();
    }
    await this.close();
  }

  /**
   * Names of the first `count` options. The dropdown must be
   * open (call open() first); it is left open.
   */
  async firstOptionNames(count: number): Promise<string[]> {
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = await this.options.nth(i).getAttribute("data-testid");
      names.push(id!.replace(TEST_IDS.countryOptionPrefix, ""));
    }
    return names;
  }

  /** Click the option at `index` (0-based) with the dropdown open. */
  async clickOptionAt(index: number) {
    await this.options.nth(index).click();
  }

  /**
   * Opens the dropdown, selects the first `count` options by position,
   * closes it and returns their names. The names are read BEFORE clicking.
   */
  async pickFirst(count: number): Promise<string[]> {
    await this.open();
    const names = await this.firstOptionNames(count);
    for (let i = 0; i < count; i++) {
      await this.clickOptionAt(i);
    }
    await this.close();
    return names;
  }
}

/** All filters: selects, country, numeric ranges, validation, and reset. */
export class Filters {
  readonly country: CountryFilter;
  readonly age: RangeFilter;
  readonly coffee: RangeFilter;
  readonly reset: Locator;

  constructor(private readonly page: Page) {
    this.country = new CountryFilter(page);
    this.age = new RangeFilter(page, TEST_IDS.ageMin, TEST_IDS.ageMax);
    this.coffee = new RangeFilter(page, TEST_IDS.coffeeMin, TEST_IDS.coffeeMax);
    this.reset = page.getByTestId(TEST_IDS.reset);
  }

  /** First validation message visible on the page. */
  get validationMessage(): Locator {
    return this.page.locator('[data-testid*="validation-error"]').first();
  }

  /** Choose an option from any select (by its data-testid). */
  async choose(testId: string, label: string) {
    await chooseOption(this.page, testId, label);
  }

  async chooseGender(label: string) {
    await this.choose(TEST_IDS.gender, label);
  }
}
