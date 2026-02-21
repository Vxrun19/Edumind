-- ─── Quizzes ──────────────────────────────────────────
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  conversation_id uuid references conversations(id) on delete set null,
  subject text not null default 'General',
  title text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  total_questions integer not null default 0,
  created_at timestamp with time zone default now()
);

alter table quizzes enable row level security;
create policy "Allow all operations on quizzes"
  on quizzes for all using (true) with check (true);

create index idx_quizzes_user on quizzes(user_id);

-- ─── Quiz Questions ──────────────────────────────────
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_number integer not null,
  question_type text not null check (question_type in ('multiple_choice', 'open_ended')),
  question_text text not null,
  options text[] default '{}',
  correct_answer text not null,
  explanation text not null default '',
  created_at timestamp with time zone default now()
);

alter table quiz_questions enable row level security;
create policy "Allow all operations on quiz_questions"
  on quiz_questions for all using (true) with check (true);

-- ─── Quiz Attempts ───────────────────────────────────
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id text not null,
  score integer not null default 0,
  total integer not null default 0,
  percentage integer not null default 0,
  answers jsonb not null default '[]',
  completed_at timestamp with time zone default now()
);

alter table quiz_attempts enable row level security;
create policy "Allow all operations on quiz_attempts"
  on quiz_attempts for all using (true) with check (true);

create index idx_quiz_attempts_user on quiz_attempts(user_id);
