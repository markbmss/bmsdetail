import { createClient } from "npm:@supabase/supabase-js@2.49.1"
import { GoogleAuth } from "npm:google-auth-library@9.14.2"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name)
  if (!v?.trim()) throw new Error(`Missing secret: ${name}`)
  return v.trim()
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n")
}

async function getCalendarAccessToken(): Promise<string> {
  const email = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
  const rawKey = requireEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")
  const auth = new GoogleAuth({
    credentials: {
      client_email: email,
      private_key: normalizePrivateKey(rawKey),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })
  const client = await auth.getClient()
  const res = await client.getAccessToken()
  const token = typeof res === "string" ? res : res?.token
  if (!token) throw new Error("Google: no access token")
  return token
}

type ClientRow = { name?: string | null; phone?: string | null; car?: string | null }

type AppointmentRow = {
  id: string
  client_id: string
  start_at: string
  end_at: string
  title: string | null
  notes: string | null
  status: string | null
  google_event_id: string | null
  clients: ClientRow | ClientRow[] | null
}

function buildEventBody(row: AppointmentRow) {
  const c = Array.isArray(row.clients) ? row.clients[0] : row.clients
  const name = c?.name?.trim() || "לקוח"
  const summary = (row.title && row.title.trim()) || `תור: ${name}`
  const parts = [c?.car, c?.phone, row.notes && row.notes.trim()].filter(Boolean)
  const description = parts.length ? parts.join(" · ") : undefined

  return {
    summary,
    description: description || undefined,
    start: { dateTime: row.start_at },
    end: { dateTime: row.end_at },
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim()
  // Cannot use SUPABASE_* name for custom secrets (reserved). Same key: Project Settings → API → service_role.
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")?.trim()
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server misconfigured: Supabase URL or service role key" }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  let body: { action?: string; appointmentId?: string; googleEventId?: string | null }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const action = body.action
  const appointmentId = body.appointmentId?.trim()
  if (!appointmentId) {
    return json({ error: "appointmentId required" }, 400)
  }

  const calendarId = encodeURIComponent(requireEnv("GOOGLE_CALENDAR_ID"))

  async function markSyncError(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from("appointments")
      .update({
        google_sync_error: msg.slice(0, 2000),
        google_last_synced_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
  }

  async function markSyncOk(patch: Record<string, unknown>) {
    await supabase
      .from("appointments")
      .update({
        ...patch,
        google_last_synced_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
  }

  try {
    if (action === "delete") {
      const delGid = (body.googleEventId || "").trim()
      if (!delGid) {
        return json({ ok: true, skipped: true, reason: "no google_event_id" })
      }
      const token = await getCalendarAccessToken()
      const authHeader = { Authorization: `Bearer ${token}` }
      const delUrl =
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(delGid)}`
      const delRes = await fetch(delUrl, { method: "DELETE", headers: authHeader })
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        const t = await delRes.text()
        throw new Error(`Google delete ${delRes.status}: ${t.slice(0, 500)}`)
      }
      await supabase
        .from("appointments")
        .update({
          google_event_id: null,
          google_sync_error: null,
          google_last_synced_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
      return json({ ok: true, deleted: true })
    }

    if (action !== "upsert") {
      return json({ error: "action must be upsert or delete" }, 400)
    }

    const token = await getCalendarAccessToken()
    const authHeader = { Authorization: `Bearer ${token}` }

    const { data: row, error: fetchErr } = await supabase
      .from("appointments")
      .select(
        "id, client_id, start_at, end_at, title, notes, status, google_event_id, clients (name, phone, car)",
      )
      .eq("id", appointmentId)
      .single()

    if (fetchErr || !row) {
      return json({ error: fetchErr?.message || "Appointment not found" }, 404)
    }

    const eventBody = buildEventBody(row as AppointmentRow)
    const gid = row.google_event_id?.trim()

    if (gid) {
      const patchUrl =
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(gid)}`
      const patchRes = await fetch(patchUrl, {
        method: "PATCH",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
      })
      if (!patchRes.ok) {
        const t = await patchRes.text()
        throw new Error(`Google patch ${patchRes.status}: ${t.slice(0, 500)}`)
      }
      await markSyncOk({ google_sync_error: null })
      return json({ ok: true, google_event_id: gid, updated: true })
    }

    const insertUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
    const insRes = await fetch(insertUrl, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    })
    if (!insRes.ok) {
      const t = await insRes.text()
      throw new Error(`Google insert ${insRes.status}: ${t.slice(0, 500)}`)
    }
    const created = (await insRes.json()) as { id?: string }
    const newId = created.id
    if (!newId) throw new Error("Google insert: no event id in response")

    await markSyncOk({ google_event_id: newId, google_sync_error: null })
    return json({ ok: true, google_event_id: newId, created: true })
  } catch (e) {
    await markSyncError(e)
    const msg = e instanceof Error ? e.message : String(e)
    return json({ ok: false, error: msg }, 502)
  }
})
