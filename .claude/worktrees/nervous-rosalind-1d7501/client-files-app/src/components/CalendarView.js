import { useMemo } from 'react'
import { weekDayDates, dateKeyJerusalem, endOfWeekSaturday, addWeeks } from '../lib/weekUtils'
import { formatTimeIl } from '../lib/format'
import { buildGoogleCalendarTemplateUrl, resolveGoogleCalendarEmbedUrl } from '../lib/googleCalendar'

const font = "'Heebo', system-ui, sans-serif"

const EMBED_SRC = process.env.REACT_APP_GOOGLE_CALENDAR_EMBED_SRC
const embedUrlResolved = resolveGoogleCalendarEmbedUrl(EMBED_SRC || '')

function threeWeekRangeLabel(firstWeekStart) {
  const end = endOfWeekSaturday(addWeeks(firstWeekStart, 2))
  const a = firstWeekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  const b = end.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${a} — ${b}`
}

function weekSubtitle(weekStart) {
  const end = endOfWeekSaturday(weekStart)
  const a = weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  const b = end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  return `${a} — ${b}`
}

export default function CalendarView({
  weekStart,
  onPrevWeek,
  onNextWeek,
  appointments,
  clients,
  loading,
  onSelectAppointment,
  onNewAppointment
}) {
  const weeks = useMemo(() => [0, 1, 2].map(i => addWeeks(weekStart, i)), [weekStart])

  const allDays = useMemo(() => {
    const days = []
    for (const ws of weeks) {
      days.push(...weekDayDates(ws))
    }
    return days
  }, [weeks])

  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])

  const byDay = useMemo(() => {
    const map = {}
    for (const d of allDays) {
      map[dateKeyJerusalem(d)] = []
    }
    for (const a of appointments || []) {
      const key = dateKeyJerusalem(new Date(a.start_at))
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((x, y) => new Date(x.start_at) - new Date(y.start_at))
    }
    return map
  }, [appointments, allDays])

  function googleUrlForAppointment(a) {
    const c = clientById[a.client_id]
    const title = a.title?.trim() || (c ? `תור: ${c.name}` : 'תור')
    const det = [c?.car, c?.phone, a.notes].filter(Boolean).join(' · ')
    return buildGoogleCalendarTemplateUrl({
      title,
      startIso: a.start_at,
      endIso: a.end_at,
      details: det || undefined
    })
  }

  return (
    <div dir="rtl" style={{ fontFamily: font, padding: '16px 20px 24px', minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a', flex: '1 1 auto' }}>יומן תורים</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={onPrevWeek} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>שבוע קודם</button>
          <button type="button" onClick={onNextWeek} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>שבוע הבא</button>
          <button type="button" onClick={() => onNewAppointment(new Date())} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>+ תור חדש</button>
        </div>
      </div>

      <p style={{ margin: '0 0 8px', fontSize: 14, color: '#666' }}>מוצגים 3 שבועות רצופים</p>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>{threeWeekRangeLabel(weekStart)}</p>

      {embedUrlResolved && (
        <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '0.5px solid #e0ddd6', background: '#fff' }}>
          <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, borderBottom: '0.5px solid #eee' }}>יומן Google (הטמעה)</div>
          <iframe
            title="Google Calendar"
            src={embedUrlResolved}
            style={{ width: '100%', height: 420, border: 'none' }}
            loading="lazy"
          />
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>טוען תורים...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {weeks.map((ws, wi) => (
            <div key={wi}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#378ADD', marginBottom: 10 }}>
                שבוע {wi + 1} · {weekSubtitle(ws)}
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
                  gap: 8,
                  minWidth: 700
                }}>
                  {weekDayDates(ws).map(d => {
                    const key = dateKeyJerusalem(d)
                    const list = byDay[key] || []
                    const dayTitle = d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })
                    return (
                      <div key={`${wi}-${key}`} style={{ background: '#fafaf8', border: '0.5px solid #e0ddd6', borderRadius: 12, padding: 10, minHeight: 160 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>{dayTitle}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {list.map(a => {
                            const c = clientById[a.client_id]
                            const gUrl = googleUrlForAppointment(a)
                            return (
                              <div
                                key={a.id}
                                style={{
                                  padding: '8px 8px',
                                  borderRadius: 8,
                                  border: '0.5px solid #ddd',
                                  background: '#fff'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => onSelectAppointment(a)}
                                  style={{
                                    textAlign: 'right', width: '100%', padding: 0,
                                    border: 'none', background: 'transparent',
                                    cursor: 'pointer', fontFamily: font
                                  }}
                                >
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{formatTimeIl(a.start_at)}</div>
                                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{c?.name || 'לקוח'}</div>
                                  {c?.car && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{c.car}</div>}
                                  {a.title && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 4 }}>{a.title}</div>}
                                </button>
                                <a
                                  href={gUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{ display: 'inline-block', marginTop: 6, fontSize: 10, color: '#185FA5' }}
                                >
                                  Google Calendar
                                </a>
                              </div>
                            )
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => onNewAppointment(d)}
                          style={{
                            marginTop: 8, width: '100%', padding: '6px', fontSize: 11, borderRadius: 6,
                            border: '0.5px dashed #bbb', background: 'transparent', color: '#888', cursor: 'pointer'
                          }}
                        >
                          + ליום זה
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
