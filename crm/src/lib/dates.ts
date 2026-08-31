export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonthsISO(dateISO: string, months: number): string {
  const d = new Date(dateISO + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** wa.me link from a stored phone number. Assumes Israeli local numbers (leading 0) when no country code is present. */
export function waLink(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d]/g, '')
  if (!digits) return null
  const international = digits.startsWith('0') ? '972' + digits.slice(1) : digits
  return `https://wa.me/${international}`
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00Z')
  const to = new Date(toISO + 'T00:00:00Z')
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/**
 * Parses Meta's Forms Library CSV export date format ("08/30/2026 6:44am")
 * into an ISO timestamp. Assumes Israel local time (the ad account's
 * timezone) since Meta's export doesn't include a timezone — approximates
 * Israel's DST window (Apr-Oct = +03:00, else +02:00) since exact
 * transition dates vary by year. Returns null if the string doesn't match.
 */
export function parseMetaCsvDate(value: string): string | null {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (!m) return null
  const [, mm, dd, yyyy, hh, min, ampm] = m
  let hour = parseInt(hh, 10)
  if (/pm/i.test(ampm) && hour !== 12) hour += 12
  if (/am/i.test(ampm) && hour === 12) hour = 0
  const month = parseInt(mm, 10)
  const offset = month >= 4 && month <= 10 ? '+03:00' : '+02:00'
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${min}:00${offset}`
}

/** Relative "time joined" label from a timestamptz string, e.g. "5m ago", "3h ago", "2d ago". */
export function relativeTime(timestamp: string): string {
  const then = new Date(timestamp).getTime()
  const now = Date.now()
  const seconds = Math.max(0, Math.round((now - then) / 1000))

  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.round(months / 12)
  return `${years}y ago`
}
