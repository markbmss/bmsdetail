/** אזור זמן לתצוגת תורים */
export const TZ_IL = 'Asia/Jerusalem'

/** שעה קצרה בתאריך ISO (לפי ישראל) */
export function formatTimeIl(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('he-IL', { timeZone: TZ_IL, hour: '2-digit', minute: '2-digit' })
}

/** מציג סכום בשקלים (ILS) לפי locale עברי */
export function formatIls(amount) {
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'))
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(n)
}

export function formatDateHe(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
}
