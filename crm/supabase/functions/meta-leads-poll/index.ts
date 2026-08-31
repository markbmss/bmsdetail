// Supabase Edge Function: meta-leads-poll
//
// Fallback to the meta-leadgen webhook (see brief: "if the app-review or
// webhook setup stalls, POLL the Graph API on a schedule"). Polls the Page's
// lead forms for new leads and inserts them into `leads` with source='meta',
// status='new' — same table, same shape as the webhook path.
//
// Not meant to be called by the public — it's triggered by a Supabase
// pg_cron job (see supabase/migrations/0002_meta_leads_poll_cron.sql) on a
// schedule. This function has "Enforce JWT Verification" turned OFF (same
// as meta-leadgen, since pg_net's http_post doesn't send a Supabase JWT
// either) and instead checks its own shared secret header below.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   META_PAGE_ACCESS_TOKEN  - long-lived Page access token
//   META_PAGE_ID            - the Page's numeric ID (e.g. 1051524491382121)
//   POLL_SECRET             - arbitrary string you choose, must match the
//                              x-poll-secret header the cron job sends
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Edge Functions runtime.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN')!
const PAGE_ID = Deno.env.get('META_PAGE_ID')!
const POLL_SECRET = Deno.env.get('POLL_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.headers.get('x-poll-secret') !== POLL_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const forms = await fetchLeadForms()
    let inserted = 0
    let skipped = 0

    for (const form of forms) {
      const leads = await fetchLeadsForForm(form.id)
      for (const lead of leads) {
        const wasInserted = await insertLeadIfNew(lead)
        if (wasInserted) inserted++
        else skipped++
      }
    }

    return Response.json({ forms: forms.length, inserted, skipped })
  } catch (err) {
    console.error('meta-leads-poll failed:', err)
    return new Response(String(err), { status: 500 })
  }
})

type GraphForm = { id: string; name: string }

async function fetchLeadForms(): Promise<GraphForm[]> {
  const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/leadgen_forms?fields=id,name&access_token=${PAGE_ACCESS_TOKEN}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`leadgen_forms error ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data ?? []
}

type GraphLeadField = { name: string; values?: string[] }
type GraphLead = { id: string; created_time: string; field_data?: GraphLeadField[] }

async function fetchLeadsForForm(formId: string): Promise<GraphLead[]> {
  const leads: GraphLead[] = []
  let url: string | null =
    `https://graph.facebook.com/v21.0/${formId}/leads?fields=id,created_time,field_data&access_token=${PAGE_ACCESS_TOKEN}`

  // Cap pagination so one poll run can't run away on a very large backlog.
  for (let page = 0; page < 10 && url; page++) {
    const res: Response = await fetch(url)
    if (!res.ok) throw new Error(`leads error ${res.status}: ${await res.text()}`)
    const json = await res.json()
    leads.push(...(json.data ?? []))
    url = json.paging?.next ?? null
  }

  return leads
}

async function insertLeadIfNew(lead: GraphLead): Promise<boolean> {
  const tag = `Meta lead ${lead.id}.`

  const { data: existing, error: selectError } = await supabase
    .from('leads')
    .select('id')
    .ilike('notes', `${tag}%`)
    .limit(1)
  if (selectError) throw selectError
  if (existing && existing.length > 0) return false

  const fields: Record<string, string> = {}
  for (const f of lead.field_data ?? []) {
    fields[f.name.toLowerCase()] = f.values?.[0] ?? ''
  }

  const name = pick(fields, ['full_name', 'name']) ?? joinNonEmpty(fields['first_name'], fields['last_name'])
  const phone = pick(fields, ['phone_number', 'phone'])
  const city = pick(fields, ['city'])
  const car = pick(fields, ['car', 'vehicle', 'car_model'])
  const serviceInterest = pick(fields, ['service_interest', 'service', 'interested_in', 'interest'])

  const { error: insertError } = await supabase.from('leads').insert({
    name: name || null,
    phone: phone || null,
    city: city || null,
    car: car || null,
    service_interest: serviceInterest || null,
    source: 'meta',
    status: 'new',
    // Use Meta's real lead-creation time, not whenever this poll happened to run.
    created_at: lead.created_time,
    notes: `${tag} Raw form fields: ${JSON.stringify(fields)}`,
  })
  if (insertError) throw insertError
  return true
}

function pick(fields: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (fields[key]) return fields[key]
  }
  return undefined
}

function joinNonEmpty(...parts: Array<string | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join(' ').trim()
  return joined || undefined
}
