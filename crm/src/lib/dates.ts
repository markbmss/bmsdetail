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
