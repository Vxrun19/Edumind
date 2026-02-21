-- ─── Learning Memory ───────────────────────────────────
-- Stores extracted memories from conversations
create table learning_memory (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subject text not null default 'General',
  memory_type text not null check (memory_type in (
    'topic_mastered', 'topic_struggling', 'interest',
    'behavior', 'correction', 'preference'
  )),
  content text not null,
  confidence_score integer not null default 3 check (
    confidence_score >= 1 and confidence_score <= 5
  ),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table learning_memory enable row level security;
create policy "Allow all operations on learning_memory"
  on learning_memory for all using (true) with check (true);

create index idx_learning_memory_user on learning_memory(user_id);
create index idx_learning_memory_user_subject on learning_memory(user_id, subject);

-- ─── Learning Insights ────────────────────────────────
-- Aggregated behavioral insights per user
create table learning_insights (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  avg_session_length integer not null default 0,
  preferred_time_of_day text not null default 'unknown',
  most_active_subject text not null default 'General',
  response_style_feedback text not null default '',
  attention_span text not null default 'medium',
  last_analyzed timestamp with time zone default now()
);

alter table learning_insights enable row level security;
create policy "Allow all operations on learning_insights"
  on learning_insights for all using (true) with check (true);

-- ─── Add next_topics column to conversations ──────────
alter table conversations add column if not exists
  next_topics text[] default '{}';
