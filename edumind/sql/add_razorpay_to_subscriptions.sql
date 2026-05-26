-- ============================================================
-- EduMind — Razorpay subscription support
-- ============================================================
-- Extends the subscriptions table to support both Stripe (existing,
-- international) and Razorpay (new, India). A user has at most one
-- active subscription at a time, regardless of provider.
--
-- Also adds a small idempotency table for Razorpay webhooks since
-- Razorpay can redeliver the same event on retry.
--
-- Run this in the Supabase SQL editor. Safe to run multiple times
-- (uses IF NOT EXISTS / IF EXISTS guards).
-- ============================================================

-- 1. Extend the subscriptions table with Razorpay-specific columns.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT;

-- 2. Constrain payment_provider to known values. Drop + recreate so the
--    migration is re-runnable without errors.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_payment_provider_check'
  ) THEN
    ALTER TABLE subscriptions
      DROP CONSTRAINT subscriptions_payment_provider_check;
  END IF;
END $$;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_provider_check
  CHECK (payment_provider IS NULL OR payment_provider IN ('stripe', 'razorpay'));

-- 3. Backfill payment_provider for any pre-existing rows. Anything with a
--    stripe_customer_id was a Stripe subscription.
UPDATE subscriptions
SET payment_provider = 'stripe'
WHERE payment_provider IS NULL
  AND stripe_customer_id IS NOT NULL;

-- 4. Idempotency table for Razorpay webhook events.
--    Razorpay can redeliver the same event_id on retry. The webhook handler
--    inserts event_id as PRIMARY KEY first; on conflict (23505) it skips
--    re-processing.
CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Default-deny RLS on the new table — matches secure_rls.sql pattern.
--    Only the service-role key (which bypasses RLS) writes here.
ALTER TABLE razorpay_webhook_events ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- Verification (read-only)
-- ────────────────────────────────────────────────────────────
-- After running, these queries should return clean results:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'subscriptions'
--   ORDER BY ordinal_position;
--   -- Expected: razorpay_customer_id, razorpay_subscription_id,
--   -- payment_provider all present.
--
--   SELECT relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   WHERE relname = 'razorpay_webhook_events';
--   -- Expected: rowsecurity = true.
--
--   SELECT count(*) FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'razorpay_webhook_events';
--   -- Expected: 0 (default-deny).
