import type { ExplorerPage } from "../pages/ExplorerPage";

/**
 * Builds a complex view: search, age and coffee ranges, a gender filter,
 * 50 rows per page and page 2.
 * Returns the selected gender.
 */
export async function buildComplexView(explorer: ExplorerPage) {
  await explorer.search.fill("a");
  await explorer.waitForResults();
  await explorer.filters.age.min.fill("25");
  await explorer.filters.age.max.fill("60");
  await explorer.filters.coffee.max.fill("10");
  await explorer.waitForResults();

  const gender = await explorer.table.firstCellText("gender");
  await explorer.filters.chooseGender(gender);
  await explorer.waitForResults();

  await explorer.pagination.selectPageSize(50);
  await explorer.waitForResults();

  await explorer.pagination.next.click();
  await explorer.waitForResults();

  return gender;
}
