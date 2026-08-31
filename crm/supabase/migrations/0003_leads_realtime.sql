-- Enables Supabase Realtime on the leads table, so the CRM can play a
-- chime the moment a new lead is inserted (webhook, poller, Make.com
-- bridge, CSV import, or manual add — any INSERT). Realtime is off by
-- default for tables not added to this publication.
--
-- Run this once in the Supabase SQL Editor.

alter publication supabase_realtime add table leads;
