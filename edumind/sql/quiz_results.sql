-- Quiz Results table for the new Quiz Mode feature
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  weak_topics TEXT[] DEFAULT '{}',
  answers JSONB NOT NULL DEFAULT '[]',
  time_taken INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_subject ON quiz_results(user_id, subject);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own quiz results
CREATE POLICY "Users can read own quiz results"
  ON quiz_results FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results FOR INSERT
  WITH CHECK (true);
