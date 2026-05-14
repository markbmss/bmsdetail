-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Clients table
create table clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  location text,
  car text,
  car_color text,
  note text,
  created_at timestamp with time zone default now()
);

-- Payments table
create table payments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  amount numeric(10,2) not null,
  date date,
  description text,
  created_at timestamp with time zone default now()
);

-- Photos table
create table photos (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  url text not null,
  label text default 'Photo',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (keeps data private)
alter table clients enable row level security;
alter table payments enable row level security;
alter table photos enable row level security;

-- Allow all operations with your anon key (the app password handles auth)
create policy "allow all" on clients for all using (true) with check (true);
create policy "allow all" on payments for all using (true) with check (true);
create policy "allow all" on photos for all using (true) with check (true);

-- Storage bucket for photos (run in SQL editor too)
insert into storage.buckets (id, name, public) values ('client-photos', 'client-photos', true);
create policy "allow all storage" on storage.objects for all using (bucket_id = 'client-photos') with check (bucket_id = 'client-photos');

-- Appointments (יומן תורים) — הרץ אם הטבלה עדיין לא קיימת בפרויקט
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid not null references clients(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text,
  notes text,
  status text default 'scheduled',
  created_at timestamptz default now(),
  google_event_id text,
  google_sync_error text,
  google_last_synced_at timestamptz,
  constraint appointment_end_after_start check (end_at > start_at)
);

comment on column public.appointments.google_event_id is
  'Google Calendar API event id; written by Edge Function google-calendar-sync for update/delete.';

create index if not exists appointments_start_at_idx on appointments (start_at);
create index if not exists appointments_client_id_idx on appointments (client_id);

alter table appointments enable row level security;

create policy "allow all appointments" on appointments for all using (true) with check (true);
