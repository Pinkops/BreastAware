-- Lead magnet email capture for /starter PWA
create table if not exists public.leads (
  id bigserial primary key,
  email text not null check (char_length(email) <= 320),
  source text not null default 'starter',
  created_at timestamptz not null default now()
);
create index if not exists idx_leads_email on public.leads (email);
create index if not exists idx_leads_created on public.leads (created_at desc);

alter table public.leads enable row level security;
drop policy if exists "Allow anon insert leads" on public.leads;
drop policy if exists "Allow authenticated read own leads" on public.leads;

create policy "Allow anon insert leads" on public.leads for insert to anon, authenticated with check (true);
create policy "Allow authenticated read own leads" on public.leads for select to authenticated using (true);

create table if not exists public.ba_leads (
  id bigserial primary key,
  email text not null,
  source text not null default 'starter',
  created_at timestamptz not null default now()
);
alter table public.ba_leads enable row level security;
drop policy if exists "Allow anon insert ba_leads" on public.ba_leads;
create policy "Allow anon insert ba_leads" on public.ba_leads for insert to anon, authenticated with check (true);
