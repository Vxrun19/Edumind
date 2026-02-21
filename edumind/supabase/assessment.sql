-- ─── Learning Assessment Table ──────────────────────────────────────────
-- Stores comprehensive learning assessment results for each student.
-- Run this SQL in your Supabase SQL Editor to create the table.

CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  grade_level TEXT NOT NULL DEFAULT '',
  learner_type TEXT NOT NULL DEFAULT '',
  cognitive_style JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasoning_score INTEGER NOT NULL DEFAULT 0 CHECK (reasoning_score >= 0 AND reasoning_score <= 5),
  reasoning_speed JSONB NOT NULL DEFAULT '[]'::jsonb,
  subject_levels JSONB NOT NULL DEFAULT '{}'::jsonb,
  subject_most_improve TEXT NOT NULL DEFAULT '',
  subject_hardest TEXT NOT NULL DEFAULT '',
  subject_most_enjoyed TEXT NOT NULL DEFAULT '',
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  challenge_behavior JSONB NOT NULL DEFAULT '{}'::jsonb,
  study_habits JSONB NOT NULL DEFAULT '{}'::jsonb,
  personality_words TEXT[] NOT NULL DEFAULT '{}',
  motivation_type TEXT NOT NULL DEFAULT '',
  personal_note TEXT NOT NULL DEFAULT '',
  learning_persona TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments (user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Allow all operations via the anon key (Clerk handles auth at the app level)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Allow all operations on assessments'
  ) THEN
    CREATE POLICY "Allow all operations on assessments"
      ON assessments
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
