-- ============================================================
-- EduMind — Supabase Schema
-- Run this SQL in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Conversations table
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subject text,
  title text not null default 'New Conversation',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast user lookups
create index idx_conversations_user_id on conversations (user_id);

-- 2. Messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Index for fast conversation lookups
create index idx_messages_conversation_id on messages (conversation_id);

-- 3. Enable Row Level Security
alter table conversations enable row level security;
alter table messages enable row level security;

-- 4. RLS policies — allow all operations via the anon key
--    (Clerk handles auth; we filter by user_id in app code)
create policy "Allow all for conversations"
  on conversations for all
  using (true)
  with check (true);

create policy "Allow all for messages"
  on messages for all
  using (true)
  with check (true);
