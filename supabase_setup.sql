-- ============================================================
-- VeriSkill — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. profiles table
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text        not null,
  role        text        not null check (role in ('student', 'recruiter')),
  college     text,                       -- filled for students
  company     text,                       -- filled for recruiters
  created_at  timestamptz default now()   not null
);

-- 2. Row-Level Security — users can only read/write their own row
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Auto-create profile on signup (optional safety net)
--    The React app does this explicitly, but this trigger acts as a fallback.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only insert if not already inserted by the app
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. skill_results table
-- Run this AFTER the profiles table is created.
-- ============================================================

create table public.skill_results (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references public.profiles(id) on delete cascade not null,
  skill_type   text        not null check (skill_type in ('dsa', 'webdev', 'sql')),
  score        numeric(4,2) not null check (score >= 0 and score <= 10),
  confidence   text        not null check (confidence in ('Low', 'Medium', 'High')),
  feedback     text,
  skill_dna    text,
  raw_data     jsonb,       -- full Gemini response stored for auditing
  created_at   timestamptz default now() not null
);

alter table public.skill_results enable row level security;

-- Students can only see their own results
create policy "Users can view own skill results"
  on public.skill_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own skill results"
  on public.skill_results for insert
  with check (auth.uid() = user_id);

-- Recruiters can read any student's results (for candidate search)
create policy "Recruiters can view all skill results"
  on public.skill_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'recruiter'
    )
  );

