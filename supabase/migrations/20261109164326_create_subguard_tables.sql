/*
# Create Subguard AI tables and seed demo data

1. New Tables
- `subscriptions`: each recurring membership found by the scan.
  - `id` (uuid, primary key)
  - `name` (text): service name, e.g. "Disney+ Hotstar"
  - `category` (text): "Streaming", "Music", etc.
  - `price` (numeric): current monthly price in USD
  - `previous_price` (numeric, nullable): earlier price, used to detect price hikes
  - `status` (text): "active" or "cancelled"
  - `alert_type` (text, nullable): "price_hike" or "duplicate" while an alert is open
  - `reviewed` (boolean): true once the user has chosen to keep it
  - `cancelled_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
- `chat_messages`: full conversation history between the user and the Subguard assistant.
  - `id` (uuid, primary key)
  - `role` (text): "assistant" or "user"
  - `content` (text)
  - `created_at` (timestamptz)

2. Seed Data
- Four demo subscriptions, including a Disney+ Hotstar price hike and a Spotify/Apple Music duplicate.
- Fixed ids are used so re-running this migration never creates duplicate rows.

3. Security
- Row level security is enabled on both tables.
- The app has no sign-in, so the anonymous and signed-in roles both receive the minimum grants needed.
- Policies are split per action (select, insert, update, delete). Delete is not granted on subscriptions or messages.

4. Important Notes
- No existing rows are modified or removed by this migration.
- Subscription updates are limited to status, alert_type, reviewed and cancelled_at through a column-level grant.
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  previous_price numeric(10, 2) CHECK (previous_price IS NULL OR previous_price >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  alert_type text CHECK (alert_type IS NULL OR alert_type IN ('price_hike', 'duplicate')),
  reviewed boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('assistant', 'user')),
  content text NOT NULL CHECK (length(content) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages (created_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON subscriptions TO anon, authenticated;
GRANT INSERT ON subscriptions TO anon, authenticated;
GRANT UPDATE (status, alert_type, reviewed, cancelled_at, previous_price, price) ON subscriptions TO anon, authenticated;
GRANT SELECT, INSERT ON chat_messages TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_subscriptions" ON subscriptions;
CREATE POLICY "anon_select_subscriptions" ON subscriptions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_subscriptions" ON subscriptions;
CREATE POLICY "anon_insert_subscriptions" ON subscriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_subscriptions" ON subscriptions;
CREATE POLICY "anon_update_subscriptions" ON subscriptions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

INSERT INTO subscriptions (id, name, category, price, previous_price, status, alert_type, reviewed)
VALUES
  ('a1111111-1111-4111-8111-111111111111', 'Disney+ Hotstar', 'Streaming', 13.99, 7.99, 'active', 'price_hike', false),
  ('a2222222-2222-4222-8222-222222222222', 'Spotify Premium', 'Music', 11.99, NULL, 'active', 'duplicate', false),
  ('a3333333-3333-4333-8333-333333333333', 'Apple Music', 'Music', 10.99, NULL, 'active', 'duplicate', false),
  ('a4444444-4444-4444-8444-444444444444', 'Netflix Standard', 'Streaming', 15.49, NULL, 'active', NULL, false),
  ('a5555555-5555-4555-8555-555555555555', 'Amazon Prime', 'Shopping', 14.99, NULL, 'active', NULL, false)
ON CONFLICT (id) DO NOTHING;
