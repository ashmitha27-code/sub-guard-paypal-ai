/*
# Restrict subscription updates to status fields

1. Modified Tables
- `subscriptions`: the update grant is narrowed so the app can only change the fields used by the cancel and keep actions.

2. Security
- Price and previous price can no longer be changed through the Data API.
- Allowed updates: status, alert_type, reviewed, cancelled_at.

3. Important Notes
- No rows are changed by this migration.
*/

REVOKE UPDATE ON subscriptions FROM anon, authenticated;
GRANT UPDATE (status, alert_type, reviewed, cancelled_at) ON subscriptions TO anon, authenticated;
