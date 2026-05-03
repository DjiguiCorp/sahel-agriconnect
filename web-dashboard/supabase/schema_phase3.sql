-- Phase 3 — à exécuter après schema.sql (SQL Editor Supabase)

create table if not exists public.soil_diagnostics (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references public.farmers(id) on delete set null,
  soil_color text not null,
  texture text not null,
  humidity text not null,
  region text not null,
  country text not null,
  season text not null,
  last_crop text not null,
  fertility_score int not null check (fertility_score between 0 and 100),
  recommended_crops jsonb not null default '[]',
  amendments jsonb not null default '[]',
  practices jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.disease_detections (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid references public.farmers(id) on delete set null,
  disease_name text not null,
  confidence numeric,
  symptoms text,
  treatment text,
  prevention text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.diaspora_producers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cooperative_name text not null,
  country text not null,
  products text[] not null default '{}',
  monthly_volume_kg numeric,
  certification text,
  email text,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.diaspora_buyers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  business_name text not null,
  us_city_state text not null,
  products_sought text[] not null default '{}',
  monthly_volume_needed_kg numeric,
  email text,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.diaspora_contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.diaspora_producers(id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists soil_diagnostics_created_idx on public.soil_diagnostics (created_at desc);
create index if not exists disease_detections_created_idx on public.disease_detections (created_at desc);

alter table public.soil_diagnostics enable row level security;
alter table public.disease_detections enable row level security;
alter table public.diaspora_producers enable row level security;
alter table public.diaspora_buyers enable row level security;
alter table public.diaspora_contact_inquiries enable row level security;

create policy "soil_insert_anon" on public.soil_diagnostics for insert to anon with check (true);
create policy "soil_select_anon" on public.soil_diagnostics for select to anon using (true);

create policy "disease_insert_anon" on public.disease_detections for insert to anon with check (true);
create policy "disease_select_anon" on public.disease_detections for select to anon using (true);

create policy "diaspora_prod_insert_anon" on public.diaspora_producers for insert to anon with check (true);
create policy "diaspora_prod_select_anon" on public.diaspora_producers for select to anon using (true);

create policy "diaspora_buy_insert_anon" on public.diaspora_buyers for insert to anon with check (true);
create policy "diaspora_buy_select_anon" on public.diaspora_buyers for select to anon using (true);

create policy "diaspora_inquiry_insert_anon" on public.diaspora_contact_inquiries for insert to anon with check (true);
create policy "diaspora_inquiry_select_anon" on public.diaspora_contact_inquiries for select to anon using (true);

-- Données de démo (producteurs visibles pour matching)
insert into public.diaspora_producers (full_name, cooperative_name, country, products, monthly_volume_kg, certification, email, phone)
values
  ('Amadou Traoré', 'Union Karité Sikasso', 'Mali', array['Karité', 'Mangue'], 2500, 'Bio local', 'amadou.ex@example.org', '+223 76 11 22 33'),
  ('Fatoumata Diallo', 'GIE Sésame Bobo', 'Burkina Faso', array['Sésame', 'Niébé'], 1800, 'Conventionnel', 'fatoumata.d@example.org', '+226 70 44 55 66'),
  ('Ibrahim Ouédraogo', 'Coopérative Céréales Kaya', 'Burkina Faso', array['Mil', 'Sorgho'], 3200, '—', 'ibrahim.o@example.org', '+226 70 77 88 99');
