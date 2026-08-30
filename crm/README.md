# BMS Detail CRM

Private, login-gated CRM for BMS Detail. React + Vite frontend, Supabase (Postgres + Auth) backend.

Lives inside the `bmsdetail` repo as an isolated top-level folder (`crm/`), alongside the
marketing site and `client-files-app/`. It does not share code, dependencies, or build/deploy
config with either — see `## Deploy` below. It deploys standalone to `crm.bmsdetail.com`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon public key
npm run dev
```

Never put the Supabase `service_role` key in this app. Only the anon public key belongs in
`.env.local` / the frontend build — RLS policies (see `supabase/migrations/`) are what actually
gate access.

## Database

Schema + Row-Level Security policies live in `supabase/migrations/0001_init_schema.sql`.
Run it once in the Supabase SQL Editor for this project (or via the Supabase CLI if you link it).

RLS model: any authenticated user (2 accounts — Mark, Yoav) has full read/write on every table.
Anon/unauthenticated gets nothing. Auth is email/password; create the 2 user accounts directly
in the Supabase Auth dashboard (Authentication → Users → Add user) — there is no self-service
sign-up in this app.

## Deploy

Separate Netlify site, same pattern as `client-files-app/`: create a new Netlify site pointed
at this repo with **base directory = `crm`**. `crm/netlify.toml` then supplies the build command
(`npm run build`), publish dir (`dist`), and SPA redirect — scoped only to that site's build, so
it never runs for the main site or `client-files-app` deploys, and vice versa. Point
`crm.bmsdetail.com` at that Netlify site's DNS target.

## Status

Phase 1 in progress: schema + RLS + login are in place. Today dashboard, Leads, and Customers
screens are next. See `../bms-crm-build-brief.md` for the full spec and later phases (jobs, B2B
accounts, Meta lead webhook, reports).
