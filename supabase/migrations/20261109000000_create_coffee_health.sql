create table public.coffee_health (
  id integer primary key,
  age smallint not null check (age between 0 and 130),
  gender text not null,
  country text not null,
  coffee_intake numeric(4, 1) not null check (coffee_intake >= 0),
  caffeine_mg numeric(6, 1) not null check (caffeine_mg >= 0),
  sleep_hours numeric(3, 1) not null check (sleep_hours between 0 and 24),
  sleep_quality text not null,
  bmi numeric(4, 1) not null,
  heart_rate smallint not null,
  stress_level text not null,
  physical_activity_hours numeric(4, 1) not null,
  health_issues text not null,
  occupation text not null,
  smoking boolean not null,
  alcohol_consumption boolean not null
);

create index coffee_health_country_idx on public.coffee_health (country);
create index coffee_health_gender_idx on public.coffee_health (gender);
create index coffee_health_sleep_quality_idx on public.coffee_health (sleep_quality);
create index coffee_health_stress_level_idx on public.coffee_health (stress_level);
create index coffee_health_age_idx on public.coffee_health (age);
create index coffee_health_coffee_intake_idx on public.coffee_health (coffee_intake);

alter table public.coffee_health enable row level security;

grant select on table public.coffee_health to anon, authenticated;
grant all on table public.coffee_health to service_role;

create policy "Allow public read access"
  on public.coffee_health
  for select
  using (true);
