"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  COUNTRIES,
  GENDERS,
  PAGE_SIZES,
  SLEEP_QUALITIES,
  STRESS_LEVELS,
  filtersToSearchParams,
  parseFilters,
  validateFilters,
  type Filters,
  type RecordsResponse,
} from "@/lib/records";

const DEBOUNCE_MS = 350;

type TextDraft = Pick<
  Filters,
  "q" | "ageMin" | "ageMax" | "coffeeMin" | "coffeeMax"
>;

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function CoffeeExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const [data, setData] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Free-text inputs are kept in a local draft and committed to the URL after a
  // short pause in typing, so we don't fire a request on every keystroke.
  const [draft, setDraft] = useState<TextDraft>({
    q: filters.q,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    coffeeMin: filters.coffeeMin,
    coffeeMax: filters.coffeeMax,
  });

  const updateFilters = useCallback(
    (patch: Partial<Filters>, { resetPage = true } = {}) => {
      const next: Filters = { ...filters, ...patch };
      if (resetPage) next.page = 1;
      const qs = filtersToSearchParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  // Commit text drafts to the URL after the debounce window.
  useEffect(() => {
    const changed = (Object.keys(draft) as (keyof TextDraft)[]).some(
      (key) => draft[key] !== filters[key],
    );
    if (!changed || validateFilters({ ...filters, ...draft })) return;
    const timer = setTimeout(() => updateFilters(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, filters, updateFilters]);

  const validationError = useMemo(
    () => validateFilters({ ...filters, ...draft }),
    [filters, draft],
  );

  // Fetch whenever the committed filters change.
  const queryString = searchParams.toString();
  useEffect(() => {
    if (validateFilters(filters)) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/records?${queryString}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Request failed");
        setData(body as RecordsResponse);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [queryString, filters]);

  const total = data?.total ?? 0;
  const pageSize = filters.pageSize;
  const page = filters.page;
  const totalPages = Math.max(1, Math.floor(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  // If the URL points past the last page (e.g. after a bookmark), snap back.
  useEffect(() => {
    if (!loading && data && page > totalPages) {
      updateFilters({ page: totalPages }, { resetPage: false });
    }
  }, [loading, data, page, totalPages, updateFilters]);

  const goToPage = (target: number) =>
    updateFilters({ page: target }, { resetPage: false });

  const hasActiveFilters =
    Object.values(draft).some((value) => value !== "") ||
    filters.q !== "" ||
    filters.countries.length > 0 ||
    filters.gender !== "" ||
    filters.sleepQuality !== "" ||
    filters.stressLevel !== "" ||
    filters.ageMin !== "" ||
    filters.ageMax !== "" ||
    filters.coffeeMin !== "" ||
    filters.coffeeMax !== "" ||
    filters.smoker !== "";

  const resetAll = () => {
    setDraft({ q: "", ageMin: "", ageMax: "", coffeeMin: "", coffeeMax: "" });
    router.replace(
      filters.pageSize === 25 ? pathname : `${pathname}?pageSize=${filters.pageSize}`,
      { scroll: false },
    );
  };

  const toggleCountry = (country: string, checked: boolean) => {
    const countries = checked
      ? [...filters.countries, country].sort()
      : filters.countries.filter((c) => c !== country);
    updateFilters({ countries });
  };

  const initialLoad = loading && !data;

  return (
    <div className="space-y-6">
      {/* Filters ------------------------------------------------------- */}
      <section
        aria-label="Filters"
        data-testid="filters"
        className="space-y-4 rounded-lg border bg-card p-4"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search"
            data-testid="search-input"
            placeholder="Search by ID, country, occupation or health issue…"
            className="pl-9"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label id="country-label">Country</Label>
            <details className="group relative" data-testid="filter-country">
              <summary
                aria-labelledby="country-label"
                className={`${selectClass} flex cursor-pointer list-none items-center justify-between`}
                data-testid="filter-country-toggle"
              >
                <span>
                  {filters.countries.length === 0
                    ? "All countries"
                    : filters.countries.length === 1
                      ? filters.countries[0]
                      : `${filters.countries.length} countries`}
                </span>
                <ChevronDown className="size-4 opacity-60 transition group-open:rotate-180" />
              </summary>
              <fieldset
                aria-label="Countries"
                className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-2 shadow-lg"
              >
                {COUNTRIES.map((country) => (
                  <label
                    key={country}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      name="country"
                      value={country}
                      data-testid={`country-option-${country}`}
                      checked={filters.countries.includes(country)}
                      onChange={(e) => toggleCountry(country, e.target.checked)}
                    />
                    {country}
                  </label>
                ))}
              </fieldset>
            </details>
          </div>

          <SelectFilter
            id="gender"
            label="Gender"
            allLabel="All genders"
            options={GENDERS}
            value={filters.gender}
            onChange={(gender) => updateFilters({ gender })}
          />
          <SelectFilter
            id="sleepQuality"
            label="Sleep quality"
            allLabel="All sleep quality"
            options={SLEEP_QUALITIES}
            value={filters.sleepQuality}
            onChange={(sleepQuality) => updateFilters({ sleepQuality })}
          />
          <SelectFilter
            id="stressLevel"
            label="Stress level"
            allLabel="All stress levels"
            options={STRESS_LEVELS}
            value={filters.stressLevel}
            onChange={(stressLevel) => updateFilters({ stressLevel })}
          />

          <RangeFilter
            id="age"
            label="Age"
            step="1"
            min={draft.ageMin}
            max={draft.ageMax}
            onMin={(ageMin) => setDraft((d) => ({ ...d, ageMin }))}
            onMax={(ageMax) => setDraft((d) => ({ ...d, ageMax }))}
          />
          <RangeFilter
            id="coffee"
            label="Coffee intake (cups/day)"
            step="0.1"
            min={draft.coffeeMin}
            max={draft.coffeeMax}
            onMin={(coffeeMin) => setDraft((d) => ({ ...d, coffeeMin }))}
            onMax={(coffeeMax) => setDraft((d) => ({ ...d, coffeeMax }))}
          />
          <SelectFilter
            id="smoker"
            label="Smoker"
            allLabel="Any"
            options={["yes", "no"]}
            optionLabels={{ yes: "Yes", no: "No" }}
            value={filters.smoker}
            onChange={(smoker) =>
              updateFilters({ smoker: smoker as Filters["smoker"] })
            }
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              data-testid="reset-filters"
              disabled={!hasActiveFilters}
              onClick={resetAll}
            >
              <X className="size-4" />
              Reset filters
            </Button>
          </div>
        </div>

        {validationError && (
          <p role="alert" data-testid="validation-error" className="text-sm text-destructive">
            {validationError}
          </p>
        )}
      </section>

      {/* Results summary ----------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" data-testid="results-summary" aria-live="polite">
          {initialLoad
            ? "Loading records…"
            : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()} records`}
        </p>
        <div className="flex items-center gap-3">
          {loading && (
            <span
              role="status"
              data-testid="loading-indicator"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </span>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize" className="whitespace-nowrap text-sm font-normal">
              Rows per page
            </Label>
            <select
              id="pageSize"
              data-testid="page-size"
              className={`${selectClass} w-20`}
              value={pageSize}
              onChange={(e) => updateFilters({ pageSize: Number(e.target.value) })}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table --------------------------------------------------------- */}
      {error ? (
        <div
          role="alert"
          data-testid="error-state"
          className="rounded-lg border border-destructive/50 p-6 text-sm text-destructive"
        >
          Something went wrong while loading records: {error}
        </div>
      ) : (
        <div
          className="relative overflow-x-auto rounded-lg border"
          aria-busy={loading}
          data-testid="results-table-container"
        >
          <Table data-testid="results-table" className={loading && data ? "opacity-50" : ""}>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead className="text-right">Coffee (cups)</TableHead>
                <TableHead className="text-right">Caffeine (mg)</TableHead>
                <TableHead className="text-right">Sleep (h)</TableHead>
                <TableHead>Sleep quality</TableHead>
                <TableHead>Stress</TableHead>
                <TableHead className="text-right">BMI</TableHead>
                <TableHead className="text-right">Heart rate</TableHead>
                <TableHead>Health issues</TableHead>
                <TableHead>Smoker</TableHead>
                <TableHead>Alcohol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoad &&
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} data-testid="skeleton-row">
                    <TableCell colSpan={15}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))}
              {!initialLoad && data?.rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className="py-10 text-center text-muted-foreground"
                    data-testid="empty-state"
                  >
                    No records match your search and filters.
                  </TableCell>
                </TableRow>
              )}
              {!initialLoad &&
                data?.rows.map((row) => (
                  <TableRow key={row.id} data-testid="result-row" data-row-id={row.id}>
                    <TableCell data-col="id" className="font-mono">{row.id}</TableCell>
                    <TableCell data-col="age">{row.age}</TableCell>
                    <TableCell data-col="gender">{row.gender}</TableCell>
                    <TableCell data-col="country">{row.country}</TableCell>
                    <TableCell data-col="occupation">{row.occupation}</TableCell>
                    <TableCell data-col="coffee_intake" className="text-right">{row.coffee_intake.toFixed(1)}</TableCell>
                    <TableCell data-col="caffeine_mg" className="text-right">{row.caffeine_mg.toFixed(1)}</TableCell>
                    <TableCell data-col="sleep_hours" className="text-right">{row.sleep_hours.toFixed(1)}</TableCell>
                    <TableCell data-col="sleep_quality">{row.sleep_quality}</TableCell>
                    <TableCell data-col="stress_level">{row.stress_level}</TableCell>
                    <TableCell data-col="bmi" className="text-right">{row.bmi.toFixed(1)}</TableCell>
                    <TableCell data-col="heart_rate" className="text-right">{row.heart_rate}</TableCell>
                    <TableCell data-col="health_issues">{row.health_issues}</TableCell>
                    <TableCell data-col="smoking">
                      <Badge variant={row.smoking ? "destructive" : "secondary"}>
                        {row.smoking ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell data-col="alcohol_consumption">
                      {row.alcohol_consumption ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination ---------------------------------------------------- */}
      <nav
        aria-label="Pagination"
        data-testid="pagination"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <span className="text-sm text-muted-foreground" data-testid="page-indicator">
          Page {page.toLocaleString()} of {totalPages.toLocaleString()}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="page-first"
            disabled={loading || page <= 1}
            onClick={() => goToPage(1)}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="page-prev"
            disabled={loading || page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="page-next"
            disabled={loading || page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="page-last"
            disabled={loading || page >= totalPages}
            onClick={() => goToPage(totalPages)}
          >
            Last
          </Button>
        </div>
      </nav>
    </div>
  );
}

function SelectFilter({
  id,
  label,
  allLabel,
  options,
  optionLabels,
  value,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  options: readonly string[];
  optionLabels?: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        data-testid={`filter-${id}`}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeFilter({
  id,
  label,
  step,
  min,
  max,
  onMin,
  onMax,
}: {
  id: string;
  label: string;
  step: string;
  min: string;
  max: string;
  onMin: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium leading-none">{label}</legend>
      <div className="flex gap-2 pt-1.5">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          placeholder="Min"
          aria-label={`${label} minimum`}
          data-testid={`filter-${id}-min`}
          value={min}
          onChange={(e) => onMin(e.target.value)}
        />
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          placeholder="Max"
          aria-label={`${label} maximum`}
          data-testid={`filter-${id}-max`}
          value={max}
          onChange={(e) => onMax(e.target.value)}
        />
      </div>
    </fieldset>
  );
}
