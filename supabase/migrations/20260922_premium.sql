alter table profiles add column if not exists is_premium boolean default false;
alter table profiles add column if not exists premium_source text;
alter table profiles add column if not exists premium_redeemed_at timestamptz;

create table if not exists entitlements (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product text not null,
  source text,
  license_key text,
  redeemed_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table entitlements enable row level security;
drop policy if exists "Users manage own entitlements" on entitlements;
create policy "Users manage own entitlements" on entitlements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
