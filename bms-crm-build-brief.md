# Claude Code Brief — BMS Detail CRM

## Mission
Build a private CRM web app for BMS Detail, hosted on a subdomain (e.g. `crm.bmsdetail.com`).
Stack: a lightweight SPA frontend (React + Vite) + **Supabase** (Postgres, Auth, auto APIs).
It must become the **single source of truth for leads** — the existing outreach agent will
write leads into the same Supabase, so do NOT create a separate lead store.

Build it in phases (below). Ship the core first; don't gold-plate.

## Stack & hosting
- Frontend: React + Vite, deployed static on the subdomain (Netlify/Vercel/GitHub Pages).
- Backend: Supabase — Postgres DB, Supabase Auth (email/password) for 2 users (Mark, Yoav), auto REST/JS APIs.
- Frontend talks to Supabase with the **anon public key** only, protected by Row-Level Security. NEVER put the `service_role` key in the frontend — that key is backend-only (used by the agent in its GitHub Actions secrets).

## Security (do this properly — it's real customer data)
- Require login for the whole app. No public pages.
- Enable RLS on every table. Policy: any authenticated user may read/write all rows (2-person business), but anon/unauthenticated gets nothing.
- Keep secrets in env vars, never committed.

## Database schema (create in Supabase)
```sql
-- lead pipeline (the outreach agent also writes here)
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
```

## The reminder engine (the feature that pays for the CRM)
Don't build a separate table for automatic reminders — derive them with queries:
- **Follow-ups due:** `leads` where `next_followup <= today` and status not in ('done','lost'); plus `tasks` where `due_date <= today` and not done.
- **Ceramic booster due:** `coatings` where `coalesce(last_booster_date, applied_date) + booster_interval_days <= today`.
- **Warranty expiring (next 30d):** `coatings` where `applied_date + (warranty_months||' months')::interval` is within 30 days.
- **B2B renewal soon:** `b2b_accounts` where `renewal_date` within 30 days.

Surface these two ways: (1) a "Today" dashboard in the app, and (2) a daily digest email — reuse the outreach agent's existing GitHub Actions cron so one morning email covers new leads AND due reminders. Each item links to the customer/lead and, where a phone exists, a one-tap `wa.me` link.

## Screens (MVP → later)
**Phase 1 (build first):**
1. Login (Supabase Auth).
2. **Today** dashboard — the four reminder lists above + new-leads count.
3. **Leads** — filterable list or simple kanban by status; add/edit; a "Convert" action that creates a customer + car (+ optional first job) and links the lead.
4. **Customers** — list + detail: contact, their cars, coatings with live warranty/booster status, job history.

**Phase 2 (after it's used daily):**
5. **Jobs** — add/edit, list or simple calendar.
6. **B2B accounts** — list + detail with renewal tracking.
7. Basic reports (revenue by month, conversion rate).

## Integration with the outreach agent
The agent currently writes leads to a Google Sheet. Migrate it to insert into the Supabase `leads` table instead (via `supabase-py` or the REST API, using the `service_role` key stored in its GitHub Actions secrets). After migration, retire the sheet so there's one source of truth.

## Meta Lead Ads integration (inbound leads)
Goal: leads submitted through the BMS Meta instant forms land in the `leads` table
automatically and in real time, tagged `source='meta'` — the same pipeline as the agent's
outbound leads, so there's one inbox for all leads.

**Recommended: a Supabase Edge Function acting as a Meta webhook endpoint.**
Flow: form submit → Meta sends a `leadgen` webhook → the Edge Function fetches the full lead
from the Graph API (`GET /{lead_id}?access_token=PAGE_TOKEN`) → inserts a row into `leads`
(map the form answers to name / phone / city / service_interest, `source='meta'`, `status='new'`)
→ optionally fires the WhatsApp auto-reply.

Setup:
- Create a Meta (Facebook) App; connect the BMS Page; generate a long-lived Page access token.
- Subscribe the app to the Page's `leadgen` webhook field; point the callback URL at the Edge Function; implement the verify handshake (echo `hub.challenge`).
- Permissions: `leads_retrieval` (plus pages_show_list / pages_read_engagement / pages_manage_metadata). As a Page admin, standard access usually suffices — but **verify current Meta app-review requirements; they change.**
- Keep the Page token + app secret in Supabase function secrets. Never in the frontend.

**Fallback / quick start:** if the app-review or webhook setup stalls, POLL the Graph API on a
schedule (`GET /{form_id}/leads`) and upsert new leads by lead id — simpler, near-real-time.
Or bridge temporarily with Make/Zapier (Meta Lead Ads → webhook) to get leads flowing today
while the native path is finished.

**Why real-time matters:** speed-to-contact is one of the biggest conversion levers — an
Israeli lead expects a reply within minutes, and a fast reply converts far better than one hours
later. Form → CRM → instant WhatsApp reply is the whole point of this wiring.

## Deliverable
A private, login-gated CRM on the subdomain, backed by Supabase, with the Today dashboard +
leads + customers/cars/coatings working end to end, **Meta ad leads flowing automatically into
the `leads` table**, the outreach agent writing into that same table, and a daily reminder
digest. Build on a branch, show me the schema and a screen at a time before wiring everything.
