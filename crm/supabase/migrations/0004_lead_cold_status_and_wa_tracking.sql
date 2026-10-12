-- Adds a 'cold' lead status (shown on the board between "new" and
-- "contacted") and tracks when the WhatsApp button was last pressed per
-- lead, so the board can show a recency dot (green/orange/red/gray).
--
-- Already applied directly to the project via the Supabase MCP connector;
-- this file just keeps migration history in the repo in sync.

alter type lead_status add value 'cold' after 'new';
alter table leads add column last_wa_click_at timestamptz;
