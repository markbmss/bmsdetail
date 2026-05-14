-- Idempotent: .safe to run multiple times in Supabase SQL Editor or via CLI
-- Stores Google Calendar event id after Edge Function sync.

alter table public.appointments
  add column if not exists google_event_id text;

alter table public.appointments
  add column if not exists google_sync_error text;

alter table public.appointments
  add column if not exists google_last_synced_at timestamptz;

comment on column public.appointments.google_event_id is
  'Google Calendar API event id; written by Edge Function google-calendar-sync for update/delete.';
