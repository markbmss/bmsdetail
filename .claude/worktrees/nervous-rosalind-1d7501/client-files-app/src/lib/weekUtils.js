/**
 * שבוע מתחיל ביום ראשון 00:00 (זמן מקומי של הדפדפן — מומלץ מחשב מוגדר לישראל).
 * לשאילתות DB משתמשים ב-toISOString() של תחילת/סוף השבוע.
 */

export function startOfWeekSunday(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfWeekSaturday(weekStart) {
  const e = new Date(weekStart)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

export function addWeeks(weekStart, delta) {
  const x = new Date(weekStart)
  x.setDate(x.getDate() + delta * 7)
  return startOfWeekSunday(x)
}

/** 7 תאריכים (אובייקט Date) מיום ראשון */
export function weekDayDates(weekStart) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const x = new Date(weekStart)
    x.setDate(weekStart.getDate() + i)
    days.push(x)
  }
  return days
}

/** מפתח YYYY-MM-DD לפי ישראל (לקיבוץ תורים לפי יום) */
export function dateKeyJerusalem(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}
