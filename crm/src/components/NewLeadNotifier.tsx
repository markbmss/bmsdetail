import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { playLeadChime } from '../lib/notifySound'

// Mounted once in the authed shell so a chime plays on any new lead,
// regardless of which screen is open. Requires realtime to be enabled for
// the `leads` table (see supabase/migrations/0003_leads_realtime.sql).
export default function NewLeadNotifier() {
  useEffect(() => {
    const channel = supabase
      .channel('leads-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, () => {
        playLeadChime()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return null
}
