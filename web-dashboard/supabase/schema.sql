-- Sahel AgriConnect — Phase 2
-- Exécuter dans Supabase → SQL Editor, puis activer les tables.

create extension if not exists "pgcrypto";

-- Agriculteurs (inscription web)
create table if not exists public.farmers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  region text not null,
  country text not null check (country in ('Mali', 'Burkina Faso', 'Niger')),
  crops text[] not null default '{}',
  area_hectares numeric,
  area_unit text not null default 'hectares' check (area_unit in ('hectares', 'acres')),
  has_irrigation text not null check (has_irrigation in ('oui', 'non', 'partiel')),
  cooperative_member boolean not null default false,
  cooperative_name text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Demandes « rejoindre une coopérative »
create table if not exists public.cooperative_inquiries (
  id uuid primary key default gen_random_uuid(),
  cooperative_id text not null,
  cooperative_name text not null,
  applicant_name text not null,
  phone text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists farmers_created_at_idx on public.farmers (created_at desc);
create index if not exists farmers_country_idx on public.farmers (country);
create index if not exists cooperative_inquiries_created_at_idx on public.cooperative_inquiries (created_at desc);

-- RLS : application SPA avec clé anon uniquement (à durcir en prod : Edge Functions + auth)
alter table public.farmers enable row level security;
alter table public.cooperative_inquiries enable row level security;

-- Politiques démo : lecture/écriture pour rôle anon (à restreindre en production)
create policy "farmers_insert_anon" on public.farmers for insert to anon with check (true);
create policy "farmers_select_anon" on public.farmers for select to anon using (true);

create policy "coop_inquiries_insert_anon" on public.cooperative_inquiries for insert to anon with check (true);
create policy "coop_inquiries_select_anon" on public.cooperative_inquiries for select to anon using (true);
