export type CoffeeHealthRecord = {
  id: number;
  age: number;
  gender: string;
  country: string;
  coffee_intake: number;
  caffeine_mg: number;
  sleep_hours: number;
  sleep_quality: string;
  bmi: number;
  heart_rate: number;
  stress_level: string;
  physical_activity_hours: number;
  health_issues: string;
  occupation: string;
  smoking: boolean;
  alcohol_consumption: boolean;
};

export type RecordsResponse = {
  rows: CoffeeHealthRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export const COUNTRIES = [
  "Australia", "Belgium", "Brazil", "Canada", "China", "Finland", "France",
  "Germany", "India", "Italy", "Japan", "Mexico", "Netherlands", "Norway",
  "South Korea", "Spain", "Sweden", "Switzerland", "UK", "USA",
] as const;
export const GENDERS = ["Female", "Male", "Other"] as const;
export const SLEEP_QUALITIES = ["Poor", "Fair", "Good", "Excellent"] as const;
export const STRESS_LEVELS = ["Low", "Medium", "High"] as const;
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export type Filters = {
  q: string;
  countries: string[];
  gender: string;
  sleepQuality: string;
  stressLevel: string;
  ageMin: string;
  ageMax: string;
  coffeeMin: string;
  coffeeMax: string;
  smoker: "" | "yes" | "no";
  page: number;
  pageSize: number;
};

type ParamsLike = { get(name: string): string | null };

function positiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function parseFilters(params: ParamsLike): Filters {
  const pageSize = positiveInt(params.get("pageSize"), DEFAULT_PAGE_SIZE);
  const smoker = params.get("smoker");
  return {
    q: params.get("q") ?? "",
    countries: (params.get("country") ?? "")
      .split(",")
      .filter((c) => (COUNTRIES as readonly string[]).includes(c)),
    gender: params.get("gender") ?? "",
    sleepQuality: params.get("sleepQuality") ?? "",
    stressLevel: params.get("stressLevel") ?? "",
    ageMin: params.get("ageMin") ?? "",
    ageMax: params.get("ageMax") ?? "",
    coffeeMin: params.get("coffeeMin") ?? "",
    coffeeMax: params.get("coffeeMax") ?? "",
    smoker: smoker === "yes" || smoker === "no" ? smoker : "",
    page: positiveInt(params.get("page"), 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize)
      ? pageSize
      : DEFAULT_PAGE_SIZE,
  };
}

export function filtersToSearchParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.countries.length) params.set("country", filters.countries.join(","));
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.sleepQuality) params.set("sleepQuality", filters.sleepQuality);
  if (filters.stressLevel) params.set("stressLevel", filters.stressLevel);
  if (filters.ageMin) params.set("ageMin", filters.ageMin);
  if (filters.ageMax) params.set("ageMax", filters.ageMax);
  if (filters.coffeeMin) params.set("coffeeMin", filters.coffeeMin);
  if (filters.coffeeMax) params.set("coffeeMax", filters.coffeeMax);
  if (filters.smoker) params.set("smoker", filters.smoker);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }
  return params;
}

/** Returns a human-readable validation error, or null if the filters are valid. */
export function validateFilters(filters: Filters): string | null {
  const checks: [string, string, string, number, number][] = [
    ["Age", filters.ageMin, filters.ageMax, 0, 130],
    ["Coffee intake", filters.coffeeMin, filters.coffeeMax, 0, 20],
  ];
  for (const [label, min, max, lo, hi] of checks) {
    const nMin = min === "" ? null : Number(min);
    const nMax = max === "" ? null : Number(max);
    if (nMin !== null && (Number.isNaN(nMin) || nMin < lo || nMin > hi)) {
      return `${label} minimum must be between ${lo} and ${hi}.`;
    }
    if (nMax !== null && (Number.isNaN(nMax) || nMax < lo || nMax > hi)) {
      return `${label} maximum must be between ${lo} and ${hi}.`;
    }
    if (nMin !== null && nMax !== null && nMin > nMax) {
      return `${label} minimum cannot be greater than the maximum.`;
    }
  }
  return null;
}
