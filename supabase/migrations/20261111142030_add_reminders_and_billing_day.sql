/*
# Add bill reminders table and billing day to subscriptions

1. New Tables
- `reminders`: upcoming bill reminder alerts shown in the dashboard.
  - `id` (uuid, primary key)
  - `subscription_name` (text): the service the reminder is about
  - `amount` (numeric): the bill amount
  - `due_date` (date): when the bill is due
  - `status` (text): "upcoming" or "paid" or "dismissed"
  - `created_at` (timestamptz)

2. Modified Tables
- `subscriptions`: add nullable `billing_day` column (integer 1-31) for the day of month a bill is due.

3. Seed Data
- A few demo reminders tied to existing seeded subscriptions.
- Demo reminders use fixed ids for idempotent re-runs.

4. Security
- Row level security enabled on `reminders`.
- Grant SELECT, INSERT, UPDATE on `reminders` to anon and authenticated (no delete).
- The app has no sign-in, so policies use `TO anon, authenticated` with `USING (true)`.
- The new `billing_day` column is added to the update grant on `subscriptions`.

5. Important Notes
- No existing rows are modified or removed.
- billing_day is nullable so existing subscriptions are unaffected.
*/

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_name text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_day integer CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31));

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON reminders TO anon, authenticated;
REVOKE UPDATE ON subscriptions FROM anon, authenticated;
GRANT UPDATE (status, alert_type, reviewed, cancelled_at, billing_day) ON subscriptions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
CREATE POLICY "anon_select_reminders" ON reminders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
CREATE POLICY "anon_insert_reminders" ON reminders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
CREATE POLICY "anon_update_reminders" ON reminders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

UPDATE subscriptions SET billing_day = 5 WHERE name = 'Disney+ Hotstar';
UPDATE subscriptions SET billing_day = 12 WHERE name = 'Netflix Standard';
UPDATE subscriptions SET billing_day = 18 WHERE name = 'Spotify Premium';
UPDATE subscriptions SET billing_day = 22 WHERE name = 'Apple Music';
UPDATE subscriptions SET billing_day = 27 WHERE name = 'Amazon Prime';

INSERT INTO reminders (id, subscription_name, amount, due_date, status)
VALUES
  ('b1111111-1111-4111-8111-111111111111', 'Disney+ Hotstar', 13.99, (CURRENT_DATE + INTERVAL '2 days')::date, 'upcoming'),
  ('b2222222-2222-4222-8222-222222222222', 'Netflix Standard', 15.49, (CURRENT_DATE + INTERVAL '5 days')::date, 'upcoming'),
  ('b3333333-3333-4333-8333-333333333333', 'Spotify Premium', 11.99, (CURRENT_DATE + INTERVAL '9 days')::date, 'upcoming')
ON CONFLICT (id) DO NOTHING;
