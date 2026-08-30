-- BMS Detail CRM — initial schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push` if you link the CLI).
-- Tables match the build brief exactly. RLS: authenticated users get full read/write,
-- anon/unauthenticated gets nothing.

-- ─── lead pipeline (the outreach agent also writes here) ───────────────────
create type lead_status as enum ('new','contacted','quoted','booked','done','lost');
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text, phone text, source text,          -- ad / instant-form / whatsapp / referral
  car text, city text, service_interest text,
  status lead_status default 'new',
  next_followup date, notes text,
  customer_id uuid                              -- set when converted
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, phone text, email text, city text, notes text
);

create table cars (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  make_model text, plate text, color text, year int, notes text
);

create type job_status as enum ('scheduled','done','paid','cancelled');
create table jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_id uuid references customers(id),
  car_id uuid references cars(id),
  service text, price numeric, vat_included boolean default false,
  job_date date, status job_status default 'scheduled',
  photos_url text, notes text
);

-- coatings drive the reminder engine
create table coatings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references cars(id) on delete cascade,
  job_id uuid references jobs(id),
  product text,                                 -- e.g. '3D Graphene 3yr'
  applied_date date,
  warranty_months int default 36,
  booster_interval_days int default 90,
  last_booster_date date, notes text
);

create table b2b_accounts (
  id uuid primary key default gen_random_uuid(),
  name text, contact_name text, phone text,
  contract_type text,                           -- per_car / membership / frequency
  monthly_value numeric, term_start date, renewal_date date,
  status text default 'active', notes text
);

-- manual follow-up tasks (automatic ones are derived by query, see below)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text, due_date date, done boolean default false,
  lead_id uuid, customer_id uuid, notes text
);

-- ─── Row-Level Security ─────────────────────────────────────────────────────
-- Policy for every table: any authenticated user (Mark, Yoav) may read/write
-- all rows. anon (unauthenticated) gets nothing. The frontend uses only the
-- anon public key, so this is the only thing standing between the internet
-- and this data.

alter table leads       enable row level security;
alter table customers   enable row level security;
alter table cars        enable row level security;
alter table jobs        enable row level security;
alter table coatings    enable row level security;
alter table b2b_accounts enable row level security;
alter table tasks       enable row level security;

create policy "authenticated full access" on leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on cars
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on jobs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on coatings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on b2b_accounts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─── Helpful indexes for the reminder engine ───────────────────────────────
create index leads_next_followup_idx on leads (next_followup) where status not in ('done','lost');
create index leads_status_idx on leads (status);
create index tasks_due_date_idx on tasks (due_date) where done = false;
create index coatings_car_id_idx on coatings (car_id);
create index cars_customer_id_idx on cars (customer_id);
create index jobs_customer_id_idx on jobs (customer_id);
create index b2b_renewal_idx on b2b_accounts (renewal_date);
