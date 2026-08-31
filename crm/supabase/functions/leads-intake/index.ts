// Supabase Edge Function: leads-intake
//
// Generic lead intake endpoint for third-party automation tools (Make.com,
// Zapier, etc.) that already have their own Meta clearance and can fetch
// full lead data themselves — this endpoint just needs the parsed fields,
// no Meta webhook signature or Graph API calls involved.
//
// Bridge for the Make.com scenario: Facebook Lead Ads (Watch Leads) trigger
// -> HTTP action POSTing here. Exists because the real meta-leadgen webhook
// is blocked on Meta App Review (Lead Access Manager requires Advanced
// Access for leads_retrieval on a Business-Portfolio-owned Page); Make's
// own Facebook integration already has that clearance, ours doesn't yet.
//
// Required secret (Project Settings -> Edge Functions -> Secrets):
//   INTAKE_SECRET  - arbitrary string you choose, must match the
//                     x-intake-secret header the caller sends
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Edge Functions runtime — this function bypasses RLS (it has no
// end-user session), same as meta-leadgen and meta-leads-poll. Using this
// function's own narrow secret rather than handing service_role directly to
// a third-party automation tool keeps that powerful key out of Make.com's
// stored credentials.
//
// Expected JSON body:
//   {
//     "external_id": "1234567890",   // optional, used for de-dup on repeat delivery
//     "created_time": "2026-08-30T06:44:00+03:00", // optional, ISO 8601 — the
//                                     // lead's real creation time (e.g. from
//                                     // Make's Facebook Lead Ads trigger),
//                                     // not whenever this request arrives
//     "name": "Yossi Cohen",
//     "phone": "0501234567",
//     "city": "Herzliya",
//     "car": "Tesla Model 3",
//     "service_interest": "Ceramic coating",
//     "source": "meta"                // optional, defaults to "meta"
//   }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const INTAKE_SECRET = Deno.env.get('INTAKE_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

type IntakeBody = {
  external_id?: string
  created_time?: string // Meta's real lead-creation timestamp, e.g. from the Facebook Lead Ads trigger's own "Created" field
  name?: string
  phone?: string
  city?: string
  car?: string
  service_interest?: string
  source?: string
}

Deno.serve(async (req) => {
  if (req.headers.get('x-intake-secret') !== INTAKE_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: IntakeBody
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request: invalid JSON', { status: 400 })
  }

  const tag = body.external_id ? `Meta lead ${body.external_id}.` : null

  if (tag) {
    const { data: existing, error: selectError } = await supabase
      .from('leads')
      .select('id')
      .ilike('notes', `${tag}%`)
      .limit(1)
    if (selectError) {
      console.error('Dedup check failed:', selectError)
      return new Response(JSON.stringify({ error: selectError.message }), { status: 500 })
    }
    if (existing && existing.length > 0) {
      return Response.json({ inserted: false, reason: 'duplicate', leadId: existing[0].id })
    }
  }

  // Use the caller's real creation timestamp when given and valid, rather
  // than defaulting to whenever this request happened to arrive.
  const createdAt =
    body.created_time && !Number.isNaN(new Date(body.created_time).getTime()) ? body.created_time : undefined

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: body.name || null,
      phone: body.phone || null,
      city: body.city || null,
      car: body.car || null,
      service_interest: body.service_interest || null,
      source: body.source || 'meta',
      status: 'new',
      ...(createdAt ? { created_at: createdAt } : {}),
      notes: tag ? `${tag} Delivered via leads-intake.` : 'Delivered via leads-intake.',
    })
    .select()
    .single()

  if (error) {
    console.error('Insert failed:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return Response.json({ inserted: true, leadId: data.id })
})
