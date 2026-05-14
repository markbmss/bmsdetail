/**
 * קישור "הוסף לאירוע" ב-Google Calendar (ללא API — נפתח בחשבון Google המחובר בדפדפן).
 * פורמט dates לפי Google: YYYYMMDDTHHmmssZ (UTC).
 */
export function buildGoogleCalendarTemplateUrl({ title, startIso, endIso, details }) {
  const fmt = (iso) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  const s = fmt(startIso)
  const e = fmt(endIso)
  if (!s || !e) return '#'
  const text = encodeURIComponent(title || 'תור')
  const dates = `${s}/${e}`
  const base = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}`
  if (details && String(details).trim()) {
    return `${base}&details=${encodeURIComponent(String(details).trim())}`
  }
  return base
}

/**
 * כתובת iframe להטמעת יומן ציבורי.
 * @param {string} raw - כתובת iframe מלאה, או מזהה יומן (אימייל) כמו business@gmail.com
 */
export function resolveGoogleCalendarEmbedUrl(raw) {
  if (!raw || !String(raw).trim()) return null
  const t = String(raw).trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const src = encodeURIComponent(t)
  return `https://calendar.google.com/calendar/embed?src=${src}&ctz=Asia%2FJerusalem`
}
