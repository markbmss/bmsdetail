-- Schedules the meta-leads-poll Edge Function to run every 5 minutes,
-- polling Meta's Graph API for new Lead Ads submissions (fallback to the
-- meta-leadgen webhook — see that function's header comment for why).
--
-- Run this once in the Supabase SQL Editor AFTER:
--   1. meta-leads-poll is deployed
--   2. its secrets are set (META_PAGE_ACCESS_TOKEN, META_PAGE_ID, POLL_SECRET)
--
-- IMPORTANT: replace both placeholders below before running:
--   <YOUR_PROJECT_REF>  - your Supabase project ref (e.g. mnzoabbetwtdzrvdtfcg)
--   <YOUR_POLL_SECRET>  - the exact same value you set for POLL_SECRET above
-- Do not commit this file back to git with real values filled in.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'meta-leads-poll',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/meta-leads-poll',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-poll-secret', '<YOUR_POLL_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's running: select * from cron.job_run_details order by start_time desc limit 10;
-- To stop it: select cron.unschedule('meta-leads-poll');
