-- ============================================================
-- EduMind — Student Profiles Schema
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  display_name text not null default '',
  age_group text not null default '',
  goals text[] not null default '{}',
  learning_style text not null default '',
  level text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_student_profiles_user_id on student_profiles (user_id);

alter table student_profiles enable row level security;

create policy "Allow all for student_profiles"
  on student_profiles for all
  using (true)
  with check (true);
