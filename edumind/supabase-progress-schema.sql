-- ============================================================
-- EduMind — Progress & Streaks Schema
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. User Progress table (per-subject stats)
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subject text not null,
  messages_sent integer not null default 0,
  sessions_count integer not null default 0,
  last_active timestamp with time zone default now(),
  created_at timestamp with time zone default now(),

  -- One row per user+subject
  unique (user_id, subject)
);

create index idx_user_progress_user_id on user_progress (user_id);

-- 2. User Streaks table (one row per user)
create table user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_study_date date,
  total_days_studied integer not null default 0
);

create index idx_user_streaks_user_id on user_streaks (user_id);

-- 3. Enable Row Level Security
alter table user_progress enable row level security;
alter table user_streaks enable row level security;

-- 4. RLS policies (Clerk handles auth; we filter by user_id in app code)
create policy "Allow all for user_progress"
  on user_progress for all
  using (true)
  with check (true);

create policy "Allow all for user_streaks"
  on user_streaks for all
  using (true)
  with check (true);
