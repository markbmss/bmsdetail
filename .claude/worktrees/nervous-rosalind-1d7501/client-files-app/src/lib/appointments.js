/**
 * טבלת appointments ב-Supabase — עמודות צפויות:
 * id, client_id, start_at, end_at, notes, status, title, created_at,
 * google_event_id, google_sync_error, google_last_synced_at
 * (ראו supabase-schema.sql בסוף הקובץ)
 */

export const APPOINTMENT_SELECT =
  'id, client_id, start_at, end_at, notes, status, title, created_at, google_event_id, google_sync_error, google_last_synced_at'

/**
 * סנכרון ל-Google Calendar (Edge Function `google-calendar-sync`).
 * @param {'upsert'|'delete'} action
 * @param {string} appointmentId
 * @param {string} [googleEventId] — לפעולת delete כשכבר יש מזהה אירוע
 */
export async function syncAppointmentGoogle(supabase, { action, appointmentId, googleEventId }) {
  const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
    body: { action, appointmentId, googleEventId: googleEventId || undefined },
  })
  if (error) return { data: null, error }
  if (data && typeof data === 'object' && data.error && data.ok === false) {
    return { data, error: new Error(String(data.error)) }
  }
  return { data, error: null }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} fromIso inclusive
 * @param {string} toIso inclusive
 */
export async function fetchAppointmentsRange(supabase, fromIso, toIso) {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .gte('start_at', fromIso)
    .lte('start_at', toIso)
    .order('start_at', { ascending: true })

  if (error) {
    console.error('fetchAppointmentsRange', error)
    return { data: [], error }
  }
  return { data: data || [], error: null }
}

export async function insertAppointment(supabase, row) {
  const { data, error } = await supabase.from('appointments').insert(row).select('id').single()
  return { data, error }
}

export async function updateAppointment(supabase, id, patch) {
  const { error } = await supabase.from('appointments').update(patch).eq('id', id)
  return { error }
}

export async function deleteAppointment(supabase, id) {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  return { error }
}
