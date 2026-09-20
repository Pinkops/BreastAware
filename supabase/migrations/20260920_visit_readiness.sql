-- Visit Readiness feature — personal organizer, not medical assessment
-- No scores, no diagnosis, optional fields, include_in_summary flag

create table if not exists public.ba_visit_readiness (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer text not null check (char_length(answer) <= 2000),
  include_in_summary boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, question_key)
);

alter table public.ba_visit_readiness enable row level security;

drop policy if exists "ba_visit_readiness_owner_all" on public.ba_visit_readiness;
create policy "ba_visit_readiness_owner_all" on public.ba_visit_readiness
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_ba_visit_readiness_user on public.ba_visit_readiness (user_id);
