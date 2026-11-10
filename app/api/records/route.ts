import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseFilters, validateFilters, type RecordsResponse } from "@/lib/records";

const COLUMNS =
  "id, age, gender, country, coffee_intake, caffeine_mg, sleep_hours, sleep_quality, bmi, heart_rate, stress_level, physical_activity_hours, health_issues, occupation, smoking, alcohol_consumption";

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  const validationError = validateFilters(filters);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Optional artificial latency so loading states are easy to observe.
  const delay = Number(process.env.API_DELAY_MS ?? 0);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  const supabase = await createClient();
  let query = supabase
    .from("coffee_health")
    .select(COLUMNS, { count: "exact" })
    .order("id", { ascending: true });

  // Strip characters that have meaning in PostgREST filter syntax.
  const q = filters.q.replace(/[,()*%\\"':.]/g, " ").trim();
  if (q) {
    const conditions = [
      `country.ilike.*${q}*`,
      `occupation.ilike.*${q}*`,
      `health_issues.ilike.*${q}*`,
    ];
    if (/^\d{1,9}$/.test(q)) conditions.push(`id.eq.${q}`);
    query = query.or(conditions.join(","));
  }

  if (filters.countries.length) query = query.in("country", filters.countries);
  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.sleepQuality) query = query.eq("sleep_quality", filters.sleepQuality);
  if (filters.stressLevel) query = query.eq("stress_level", filters.stressLevel);
  if (filters.ageMin) query = query.gte("age", Number(filters.ageMin));
  if (filters.ageMax) query = query.lte("age", Number(filters.ageMax));
  if (filters.coffeeMin) query = query.gte("coffee_intake", Number(filters.coffeeMin));
  if (filters.coffeeMax) query = query.lte("coffee_intake", Number(filters.coffeeMax));
  if (filters.smoker) query = query.eq("smoking", filters.smoker === "yes");

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  const { data, count, error } = await query.range(from, to);

  // PostgREST answers 416 when the requested range starts past the last row.
  if (error && error.code !== "PGRST103") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const body: RecordsResponse = {
    rows: (data ?? []).map((row) => ({
      ...row,
      coffee_intake: Number(row.coffee_intake),
      caffeine_mg: Number(row.caffeine_mg),
      sleep_hours: Number(row.sleep_hours),
      bmi: Number(row.bmi),
      physical_activity_hours: Number(row.physical_activity_hours),
    })),
    total: count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
  return NextResponse.json(body);
}
