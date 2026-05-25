-- ============================================================
-- EduMind — Secure RLS lockdown
-- ============================================================
-- This migration removes every permissive "USING (true)" / "Allow all"
-- policy from every user-data table and leaves RLS enabled with no
-- policies attached. The effect is default-deny for any connection
-- that goes through RLS (i.e. the anon key from the browser).
--
-- The Supabase service-role key bypasses RLS by design, so all server-
-- side code that uses src/lib/supabaseAdmin.ts continues to work.
-- The anon key from src/lib/supabase.ts will no longer be able to
-- read or write any user data — which is the desired outcome, because
-- it was previously exposed in the browser bundle.
--
-- Catalog tables (courses, lessons): no client-side / public-page code
-- reads them directly today (verified by grep), so they are also locked
-- to default-deny. All catalog reads now flow through API routes that
-- use the service-role client. If a future public/landing page needs
-- to read courses without auth, add a single explicit policy:
--   CREATE POLICY "Public read of courses" ON public.courses
--     FOR SELECT TO anon USING (true);
--
-- Run this in the Supabase SQL editor. Safe to run multiple times.
-- ============================================================

-- Session-scoped helper: drop every existing policy on a table and
-- ensure RLS is enabled. Uses pg_temp so it auto-cleans at session end.
CREATE OR REPLACE FUNCTION pg_temp.edumind_lockdown(tbl text)
RETURNS void AS $$
DECLARE
  pol record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
  ) THEN
    RAISE NOTICE 'Skipping % (table does not exist)', tbl;
    RETURN;
  END IF;

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = tbl
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    RAISE NOTICE 'Dropped policy % on %', pol.policyname, tbl;
  END LOOP;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- Apply lockdown to every user-data and catalog table
-- ────────────────────────────────────────────────────────────

-- Chat / conversations
SELECT pg_temp.edumind_lockdown('conversations');
SELECT pg_temp.edumind_lockdown('messages');

-- Student profile / assessment
SELECT pg_temp.edumind_lockdown('student_profiles');
SELECT pg_temp.edumind_lockdown('assessments');

-- Learning state
SELECT pg_temp.edumind_lockdown('learning_memory');
SELECT pg_temp.edumind_lockdown('learning_insights');

-- Progress / streaks
SELECT pg_temp.edumind_lockdown('user_progress');
SELECT pg_temp.edumind_lockdown('user_streaks');

-- Quizzes
SELECT pg_temp.edumind_lockdown('quizzes');
SELECT pg_temp.edumind_lockdown('quiz_questions');
SELECT pg_temp.edumind_lockdown('quiz_attempts');
SELECT pg_temp.edumind_lockdown('quiz_results');

-- Courses (catalog + per-user progress)
SELECT pg_temp.edumind_lockdown('courses');
SELECT pg_temp.edumind_lockdown('lessons');
SELECT pg_temp.edumind_lockdown('course_progress');

-- Billing
SELECT pg_temp.edumind_lockdown('subscriptions');

-- Trending topic cache
SELECT pg_temp.edumind_lockdown('trending_cache');

-- ────────────────────────────────────────────────────────────
-- Verification (read-only — run these after to confirm)
-- ────────────────────────────────────────────────────────────
-- Every row should show rowsecurity = true and zero remaining policies:
--
--   SELECT c.relname AS table_name,
--          c.relrowsecurity AS rls_enabled,
--          (SELECT count(*) FROM pg_policies p
--             WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policy_count
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public'
--     AND c.relkind = 'r'
--     AND c.relname IN (
--       'conversations','messages','student_profiles','assessments',
--       'learning_memory','learning_insights','user_progress','user_streaks',
--       'quizzes','quiz_questions','quiz_attempts','quiz_results',
--       'courses','lessons','course_progress','subscriptions','trending_cache'
--     )
--   ORDER BY c.relname;
