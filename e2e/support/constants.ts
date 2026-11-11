/**
 * Values shared by all tests.
 * If anything in the app changes (a data-testid, the total number of records, a limit),
 * it is corrected HERE and nowhere else.
 */

export const TOTAL_RECORDS = 10000;
export const TOTAL_SUMMARY = "Showing 1–25 of 10,000 records";
export const PAGE_SIZES = [10, 25, 50, 100] as const;

// Time to let the search/filter debounce fire before confirming
// that NO request was sent.
export const DEBOUNCE_GRACE_MS = 1000;

export const API_ROUTE = "**/api/records*";
export const API_PATH = "/api/records";

export const TEST_IDS = {
  // search and reset
  search: "search-input",
  reset: "reset-filters",

  // single selection filters
  gender: "filter-gender",
  sleepQuality: "filter-sleepQuality",
  stressLevel: "filter-stressLevel",
  smoker: "filter-smoker",

  // country (multiple choice)
  countryTrigger: "filter-country",
  countryOptionPrefix: "country-option-",

  // numeric ranges
  ageMin: "filter-age-min",
  ageMax: "filter-age-max",
  coffeeMin: "filter-coffee-min",
  coffeeMax: "filter-coffee-max",

  // table and results
  row: "result-row",
  summary: "results-summary",
  emptyState: "empty-state",

  // pagination
  first: "page-first",
  prev: "page-prev",
  next: "page-next",
  last: "page-last",
  indicator: "page-indicator",
  pageSize: "page-size",

  // loading state
  loading: "loading-indicator",
} as const;

// Column names (data-col attribute).
export const COL = {
  country: "country",
  age: "age",
  coffee: "coffee_intake",
  gender: "gender",
  occupation: "occupation",
} as const;

// Single selection filters: used to generate one test per filter.
export const SELECT_FILTERS = [
  { name: "gender", testId: TEST_IDS.gender, col: "gender" },
  {
    name: "sleep quality",
    testId: TEST_IDS.sleepQuality,
    col: "sleep_quality",
  },
  { name: "stress level", testId: TEST_IDS.stressLevel, col: "stress_level" },
  { name: "smoking", testId: TEST_IDS.smoker, col: "smoking" },
] as const;

// Query-string parameters that may be present even in the default view
// (they carry pagination defaults, not search or filter state).
// If the app uses other names for them, adjust them HERE.
export const NEUTRAL_URL_PARAMS = ["page", "pageSize"] as const;

// Valid limits of numeric ranges.
export const LIMITS = {
  age: { min: 0, max: 130 },
  coffee: { min: 0, max: 20 },
} as const;
