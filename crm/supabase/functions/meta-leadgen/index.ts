// Supabase Edge Function: meta-leadgen
//
// Receives Meta (Facebook) Lead Ads `leadgen` webhooks, fetches the full
// lead from the Graph API, and inserts it into the `leads` table with
// source='meta', status='new' — the same table the outreach agent writes
// to, so there is one inbox for all leads.
//
// Required secrets (set via `supabase secrets set` or Project Settings ->
// Edge Functions -> Secrets in the Supabase Dashboard — never in the
// frontend):
//   META_VERIFY_TOKEN       - a string you choose yourself, used only for
//                              the webhook subscribe handshake below
//   META_APP_SECRET         - Meta App dashboard -> Settings -> Basic
//   META_PAGE_ACCESS_TOKEN  - long-lived Page access token
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Edge Functions runtime — this function needs the service role to
// bypass RLS (it has no end-user session), same as the outreach agent.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN')!
const APP_SECRET = Deno.env.get('META_APP_SECRET')!
const PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // Meta's webhook subscription handshake: GET with hub.* query params.
  // Echo hub.challenge back only if hub.verify_token matches our secret.
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()

  const signatureHeader = req.headers.get('x-hub-signature-256')
  if (!(await verifySignature(rawBody, signatureHeader, APP_SECRET))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: MetaWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  for (const leadgenId of extractLeadgenIds(payload)) {
    try {
      await processLead(leadgenId)
    } catch (err) {
      // Log and keep going — one bad lead in a batch shouldn't drop the rest.
      console.error(`Failed to process leadgen_id ${leadgenId}:`, err)
    }
  }

  // Meta expects a fast 200 regardless of downstream outcome, or it will
  // keep retrying the whole delivery.
  return new Response('EVENT_RECEIVED', { status: 200 })
})

type MetaWebhookPayload = {
  object: string
  entry?: Array<{
    changes?: Array<{
      field: string
      value?: { leadgen_id?: string }
    }>
  }>
}

function extractLeadgenIds(payload: MetaWebhookPayload): string[] {
  const ids: string[] = []
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        ids.push(change.value.leadgen_id)
      }
    }
  }
  return ids
}

type GraphLeadField = { name: string; values?: string[] }
type GraphLeadResponse = { id: string; created_time: string; field_data?: GraphLeadField[] }

async function processLead(leadgenId: string) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${leadgenId}?fields=id,created_time,field_data&access_token=${PAGE_ACCESS_TOKEN}`,
  )
  if (!res.ok) {
    throw new Error(`Graph API error ${res.status}: ${await res.text()}`)
  }
  const lead: GraphLeadResponse = await res.json()

  // Meta form field names/keys vary per form and aren't known ahead of
  // time, so map the common ones and keep the raw fields in `notes` as a
  // fallback so nothing is silently lost if a field isn't recognized.
  const fields: Record<string, string> = {}
  for (const f of lead.field_data ?? []) {
    fields[f.name.toLowerCase()] = f.values?.[0] ?? ''
  }

  const name = pick(fields, ['full_name', 'name']) ?? joinNonEmpty(fields['first_name'], fields['last_name'])
  const phone = pick(fields, ['phone_number', 'phone'])
  const city = pick(fields, ['city'])
  const car = pick(fields, ['car', 'vehicle', 'car_model'])
  const serviceInterest = pick(fields, ['service_interest', 'service', 'interested_in', 'interest'])

  const { error } = await supabase.from('leads').insert({
    name: name || null,
    phone: phone || null,
    city: city || null,
    car: car || null,
    service_interest: serviceInterest || null,
    source: 'meta',
    status: 'new',
    // Use Meta's real lead-creation time, not whenever the webhook delivered.
    created_at: lead.created_time,
    notes: `Meta lead ${leadgenId}. Raw form fields: ${JSON.stringify(fields)}`,
  })
  if (error) throw error
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

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expectedHex = signatureHeader.slice('sha256='.length)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(computedHex, expectedHex)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
