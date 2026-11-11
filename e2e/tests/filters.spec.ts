import { test, expect } from "../fixtures/test";
import {
  COL,
  DEBOUNCE_GRACE_MS,
  SELECT_FILTERS,
  TOTAL_SUMMARY,
} from "../support/constants";
import { trackApiRequests } from "../support/network";

test.describe("Filters", () => {
  test.describe("each filter on its own", () => {
    for (const filter of SELECT_FILTERS) {
      test(`${filter.name} keeps only matching rows`, async ({ explorer }) => {
        // A real value from the first row is used to avoid depending on the seed data.
        const value = await explorer.table.firstCellText(filter.col);

        await explorer.filters.choose(filter.testId, value);
        await explorer.waitForResults();

        const cells = await explorer.table.columnTexts(filter.col);
        expect(cells.length).toBeGreaterThan(0);
        for (const cell of cells) {
          expect(cell).toBe(value);
        }
      });
    }

    test("country: a single country keeps only rows from that country", async ({
      explorer,
    }) => {
      const country = await explorer.table.firstCellText(COL.country);

      await explorer.filters.country.select([country]);
      await explorer.waitForResults();

      const countries = await explorer.table.columnTexts(COL.country);
      expect(countries.length).toBeGreaterThan(0);
      for (const c of countries) {
        expect(c).toBe(country);
      }
    });

    test("country: multiple countries show rows from any of them", async ({
      explorer,
    }) => {
      const picked = await explorer.filters.country.pickFirst(2);
      await explorer.waitForResults();

      const countries = await explorer.table.columnTexts(COL.country);
      expect(countries.length).toBeGreaterThan(0);
      for (const c of countries) {
        expect(picked).toContain(c);
      }
    });

    test("age: min and max are inclusive", async ({ explorer }) => {
      const age = await explorer.table.firstCellText(COL.age);

      await explorer.filters.age.set(age, age);
      await explorer.waitForResults();

      const ages = await explorer.table.columnTexts(COL.age);
      expect(ages.length).toBeGreaterThan(0);
      for (const a of ages) {
        expect(a).toBe(age);
      }
    });

    test("age: only a minimum (empty max) is accepted", async ({
      explorer,
    }) => {
      await explorer.filters.age.min.fill("60");
      await explorer.waitForResults();

      await expect(explorer.filters.validationMessage).toBeHidden();
      const ages = await explorer.table.columnTexts(COL.age);
      expect(ages.length).toBeGreaterThan(0);
      for (const a of ages) {
        expect(Number(a)).toBeGreaterThanOrEqual(60);
      }
    });

    test("age: only a maximum (empty min) is accepted", async ({
      explorer,
    }) => {
      await explorer.filters.age.max.fill("25");
      await explorer.waitForResults();

      await expect(explorer.filters.validationMessage).toBeHidden();
      const ages = await explorer.table.columnTexts(COL.age);
      expect(ages.length).toBeGreaterThan(0);
      for (const a of ages) {
        expect(Number(a)).toBeLessThanOrEqual(25);
      }
    });

    test("coffee intake: min and max are inclusive", async ({ explorer }) => {
      const coffee = await explorer.table.firstCellText(COL.coffee);

      await explorer.filters.coffee.set(coffee, coffee);
      await explorer.waitForResults();

      const values = await explorer.table.columnTexts(COL.coffee);
      expect(values.length).toBeGreaterThan(0);
      for (const v of values) {
        expect(Number(v)).toBe(Number(coffee));
      }
    });

    // KNOWN FAILURE: BUG-002. `test.fail()` marks this test as an expected failure,
    // so it is reported as passed while the bug exists. When the bug is fixed,
    // Playwright reports an unexpected pass: remove the `test.fail()` line then.
    test("age: a decimal value within range does not cause an error [BUG-002]", async ({
      explorer,
    }) => {
      test.fail(
        true,
        "BUG-002: a decimal age makes the API fail with a raw smallint error",
      );

      await explorer.filters.age.set("3.3", "3.4");
      await explorer.waitForResults();

      // No whole age lies between 3.3 and 3.4: the empty state is expected.
      await expect(explorer.table.emptyState).toBeVisible();
      await expect(explorer.table.errorMessage).toBeHidden();
    });
  });

  test.describe("numeric range limits and validation", () => {
    test("age 0–130 are valid limits: no message, all records remain", async ({
      explorer,
    }) => {
      await explorer.filters.age.set("0", "130");
      await explorer.waitForResults();

      await expect(explorer.filters.validationMessage).toBeHidden();
      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
    });

    test("coffee intake 0–20 are valid limits: no message, all records remain", async ({
      explorer,
    }) => {
      await explorer.filters.coffee.set("0", "20");
      await explorer.waitForResults();

      await expect(explorer.filters.validationMessage).toBeHidden();
      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
    });

    const invalidCases = [
      { name: "age below 0", filter: "age", field: "min", value: "-1" },
      { name: "age above 130", filter: "age", field: "max", value: "131" },
      {
        name: "coffee intake below 0",
        filter: "coffee",
        field: "min",
        value: "-1",
      },
      {
        name: "coffee intake above 20",
        filter: "coffee",
        field: "max",
        value: "21",
      },
    ] as const;

    for (const c of invalidCases) {
      test(`${c.name} shows a validation message and sends no request`, async ({
        explorer,
      }) => {
        const requests = trackApiRequests(explorer.page);
        const before = requests();

        await explorer.filters[c.filter][c.field].fill(c.value);

        await expect(explorer.filters.validationMessage).toBeVisible();
        await explorer.page.waitForTimeout(DEBOUNCE_GRACE_MS);
        expect(requests()).toBe(before);
      });
    }

    test("age min greater than max shows a validation message and sends no request", async ({
      explorer,
    }) => {
      const requests = trackApiRequests(explorer.page);
      await explorer.filters.age.max.fill("40");
      await explorer.waitForResults();
      const beforeInvalid = requests();
      await explorer.filters.age.min.fill("50");
      await expect(explorer.filters.validationMessage).toBeVisible();
      await explorer.page.waitForTimeout(DEBOUNCE_GRACE_MS);
      expect(requests()).toBe(beforeInvalid);
    });

    test("coffee min greater than max shows a validation message and sends no request", async ({
      explorer,
    }) => {
      const requests = trackApiRequests(explorer.page);

      await explorer.filters.coffee.max.fill("5");
      await explorer.waitForResults();
      const beforeInvalid = requests();
      await explorer.filters.coffee.min.fill("10");
      await expect(explorer.filters.validationMessage).toBeVisible();
      await explorer.page.waitForTimeout(DEBOUNCE_GRACE_MS);
      expect(requests()).toBe(beforeInvalid);
    });

    test("fixing an invalid value clears the message and updates results", async ({
      explorer,
    }) => {
      await explorer.filters.age.min.fill("-1");
      await expect(explorer.filters.validationMessage).toBeVisible();

      await explorer.filters.age.min.fill("60");
      await explorer.waitForResults();

      await expect(explorer.filters.validationMessage).toBeHidden();
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
    });
  });

  test.describe("combining filters with search", () => {
    test("search and a filter are combined with AND", async ({ explorer }) => {
      const gender = await explorer.table.firstCellText(COL.gender);

      await explorer.search.fill("Japan");
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);
      await explorer.waitForResults();
      const searchOnly = (await explorer.pagination.readSummary()).total;

      await explorer.filters.chooseGender(gender);
      await explorer.waitForResults();

      const countries = await explorer.table.columnTexts(COL.country);
      const genders = await explorer.table.columnTexts(COL.gender);
      expect(countries.length).toBeGreaterThan(0);
      for (const c of countries) expect(c.toLowerCase()).toContain("japan");
      for (const g of genders) expect(g).toBe(gender);

      // Adding a filter (AND) can only keep or reduce the number of matches.
      const combined = (await explorer.pagination.readSummary()).total;
      expect(combined).toBeGreaterThan(0);
      expect(combined).toBeLessThanOrEqual(searchOnly);
    });

    test("several filters combined with search all apply together", async ({
      explorer,
    }) => {
      const gender = await explorer.table.firstCellText(COL.gender);

      await explorer.search.fill("Japan");
      await explorer.filters.chooseGender(gender);
      await explorer.filters.age.min.fill("30");
      await explorer.waitForResults();
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);

      const rows = await explorer.table.rows.count();
      for (let i = 0; i < rows; i++) {
        const country = await explorer.table.cell(i, COL.country).innerText();
        const rowGender = await explorer.table.cell(i, COL.gender).innerText();
        const age = await explorer.table.cell(i, COL.age).innerText();

        expect(country.toLowerCase()).toContain("japan");
        expect(rowGender.trim()).toBe(gender);
        expect(Number(age)).toBeGreaterThanOrEqual(30);
      }
    });

    test("filters that exclude everything show the empty state", async ({
      explorer,
    }) => {
      await explorer.search.fill("zzzz-no-match-qqqq");
      await explorer.filters.age.min.fill("30");

      await expect(explorer.table.emptyState).toBeVisible();
    });
  });

  test.describe("reset filters", () => {
    test("is disabled when there are no filters", async ({ explorer }) => {
      await expect(explorer.filters.reset).toBeDisabled();
    });

    test("is enabled once a filter or search is applied", async ({
      explorer,
    }) => {
      await explorer.filters.age.min.fill("60");
      await expect(explorer.filters.reset).toBeEnabled();
    });

    test("clears search and all filters and restores the full list", async ({
      explorer,
    }) => {
      const gender = await explorer.table.firstCellText(COL.gender);

      await explorer.search.fill("Japan");
      await explorer.filters.chooseGender(gender);
      await explorer.filters.age.min.fill("30");
      await explorer.filters.coffee.max.fill("5");
      await explorer.waitForResults();
      await expect(explorer.pagination.summary).not.toHaveText(TOTAL_SUMMARY);

      await explorer.filters.reset.click();
      await explorer.waitForResults();

      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      await expect(explorer.search.input).toHaveValue("");
      await expect(explorer.filters.age.min).toHaveValue("");
      await expect(explorer.filters.coffee.max).toHaveValue("");
      await expect(explorer.filters.reset).toBeDisabled();
    });

    test("returns to page 1 from a later page", async ({ explorer }) => {
      // Apply the filter FIRST (it resets the page), THEN move to page 2,
      // so that Reset is what brings the view back to page 1.
      await explorer.filters.age.min.fill("30");
      await explorer.waitForResults();
      await explorer.pagination.goNext();
      expect((await explorer.pagination.readIndicator()).current).toBe(2);

      await explorer.filters.reset.click();
      await explorer.waitForResults();

      await expect(explorer.pagination.summary).toHaveText(TOTAL_SUMMARY);
      expect((await explorer.pagination.readIndicator()).current).toBe(1);
    });
  });
});
