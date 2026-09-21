-- MOVE 13: Premium entitlement — FIXED for ba_profiles (not profiles)
-- Your init uses ba_profiles with user_id, not profiles with id

alter table public.ba_profiles add column if not exists is_premium boolean default false;
alter table public.ba_profiles add column if not exists premium_source text;
alter table public.ba_profiles add column if not exists premium_redeemed_at timestamptz;

-- Optional entitlements table for audit (prefixed ba_ for consistency, but also support entitlements)
create table if not exists public.ba_entitlements (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product text not null,
  source text,
  license_key text,
  redeemed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Also create non-prefixed entitlements for backward compat if needed
create table if not exists public.entitlements (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product text not null,
  source text,
  license_key text,
  redeemed_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.ba_entitlements enable row level security;
alter table public.entitlements enable row level security;

drop policy if exists "Users manage own entitlements" on public.ba_entitlements;
drop policy if exists "Users manage own entitlements" on public.entitlements;

create policy "Users manage own entitlements" on public.ba_entitlements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own entitlements" on public.entitlements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
