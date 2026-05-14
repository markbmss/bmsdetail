import { useState, useEffect, useMemo } from 'react'
import {
  insertAppointment,
  updateAppointment,
  deleteAppointment,
  syncAppointmentGoogle
} from '../lib/appointments'
import { supabase } from '../lib/supabase'
import { buildGoogleCalendarTemplateUrl } from '../lib/googleCalendar'

const font = "'Heebo', system-ui, sans-serif"

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'מוזמן' },
  { value: 'completed', label: 'בוצע' },
  { value: 'cancelled', label: 'בוטל' }
]

/** משך בשעות: 1–8 (בדקות לשמירה במסד) */
const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map(h => ({
  value: h * 60,
  label: h === 1 ? 'שעה' : `${h} שעות`
}))

const ALLOWED_MINUTES = DURATION_OPTIONS.map(o => o.value)

function snapDurationMinutes(m) {
  let best = 60
  for (const v of ALLOWED_MINUTES) {
    if (Math.abs(v - m) < Math.abs(best - m)) best = v
  }
  return best
}

function splitIsoForInputs(iso) {
  if (!iso) return { dateStr: '', timeStr: '09:00' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { dateStr: '', timeStr: '09:00' }
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return { dateStr: `${y}-${mo}-${da}`, timeStr: `${h}:${mi}` }
}

function combineLocalDateAndTime(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi] = timeStr.split(':').map(Number)
  const local = new Date(y, mo - 1, d, h, mi, 0, 0)
  return local.toISOString()
}

function addMinutesIso(isoStart, minutes) {
  const t = new Date(isoStart).getTime() + minutes * 60 * 1000
  return new Date(t).toISOString()
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart)
}

export default function AppointmentModal({
  open,
  onClose,
  clients,
  appointment,
  lockedClientId,
  defaultDate,
  existingAppointments,
  onSaved
}) {
  const isEdit = Boolean(appointment?.id)
  const [clientId, setClientId] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('09:00')
  const [durationMin, setDurationMin] = useState(60)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [saving, setSaving] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [warnOverlap, setWarnOverlap] = useState('')

  useEffect(() => {
    if (!open) return
    setWarnOverlap('')
    setClientSearch('')
    if (appointment) {
      const { dateStr: ds, timeStr: ts } = splitIsoForInputs(appointment.start_at)
      setClientId(appointment.client_id || '')
      setDateStr(ds)
      setTimeStr(ts)
      const start = new Date(appointment.start_at)
      const end = new Date(appointment.end_at)
      const diffMin = Math.round((end - start) / 60000)
      setDurationMin(snapDurationMinutes(diffMin))
      setTitle(appointment.title || '')
      setNotes(appointment.notes || '')
      setStatus(appointment.status || 'scheduled')
    } else {
      const base = defaultDate && !Number.isNaN(new Date(defaultDate).getTime())
        ? new Date(defaultDate)
        : new Date()
      const { dateStr: ds } = splitIsoForInputs(base.toISOString())
      setClientId(lockedClientId || '')
      setDateStr(ds)
      setTimeStr('09:00')
      setDurationMin(60)
      setTitle('')
      setNotes('')
      setStatus('scheduled')
    }
  }, [open, appointment, lockedClientId, defaultDate])

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.car || '').toLowerCase().includes(q)
    )
  }, [clients, clientSearch])

  if (!open) return null

  const googlePreviewUrl = (() => {
    if (!dateStr || !timeStr) return null
    try {
      const startIso = combineLocalDateAndTime(dateStr, timeStr)
      const endIso = addMinutesIso(startIso, durationMin)
      const c = clients.find(x => x.id === clientId)
      const t = title.trim() || (c ? `תור: ${c.name}` : 'תור')
      const det = [c?.car, c?.phone, notes.trim()].filter(Boolean).join(' · ')
      return buildGoogleCalendarTemplateUrl({
        title: t,
        startIso,
        endIso,
        details: det || undefined
      })
    } catch {
      return null
    }
  })()

  const handleDelete = async () => {
    if (!isEdit || !window.confirm('למחוק את התור?')) return
    setSaving(true)
    const gid = appointment.google_event_id?.trim()
    if (gid) {
      const { error: syncErr } = await syncAppointmentGoogle(supabase, {
        action: 'delete',
        appointmentId: appointment.id,
        googleEventId: gid
      })
      if (syncErr) {
        const proceed = window.confirm(
          'מחיקה מ-Google Calendar נכשלה. למחוק בכל זאת מהאפליקציה?\n' + (syncErr.message || '')
        )
        if (!proceed) {
          setSaving(false)
          return
        }
      }
    }
    const { error } = await deleteAppointment(supabase, appointment.id)
    setSaving(false)
    if (!error) {
      onSaved()
      onClose()
    } else {
      window.alert('שגיאה במחיקה: ' + (error.message || ''))
    }
  }

  const handleSave = async () => {
    if (!clientId || !dateStr || !timeStr) return
    const startIso = combineLocalDateAndTime(dateStr, timeStr)
    const endIso = addMinutesIso(startIso, durationMin)

    const others = (existingAppointments || []).filter(a => !isEdit || a.id !== appointment.id)
    const hit = others.find(a =>
      overlaps(startIso, endIso, a.start_at, a.end_at)
    )
    if (hit) {
      setWarnOverlap('יש חפיפה עם תור אחר באותו טווח זמן. אפשר לשמור בכל זאת.')
    } else {
      setWarnOverlap('')
    }

    setSaving(true)
    const row = {
      client_id: clientId,
      start_at: startIso,
      end_at: endIso,
      title: title.trim() || null,
      notes: notes.trim() || null,
      status: status || 'scheduled'
    }

    if (isEdit) {
      const { error } = await updateAppointment(supabase, appointment.id, row)
      if (error) {
        setSaving(false)
        window.alert('שגיאה בשמירה: ' + (error.message || ''))
        return
      }
      const { error: syncErr } = await syncAppointmentGoogle(supabase, {
        action: 'upsert',
        appointmentId: appointment.id
      })
      setSaving(false)
      if (syncErr) {
        window.alert('נשמר באפליקציה, אך סנכרון Google נכשל: ' + (syncErr.message || ''))
      }
      onSaved()
      onClose()
    } else {
      const { data: inserted, error } = await insertAppointment(supabase, row)
      if (error) {
        setSaving(false)
        window.alert('שגיאה ביצירה: ' + (error.message || ''))
        return
      }
      const { error: syncErr } = await syncAppointmentGoogle(supabase, {
        action: 'upsert',
        appointmentId: inserted.id
      })
      setSaving(false)
      if (syncErr) {
        window.alert('נשמר באפליקציה, אך סנכרון Google נכשל: ' + (syncErr.message || ''))
      }
      onSaved()
      onClose()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div dir="rtl" style={{
        background: '#fff', borderRadius: 16, border: '0.5px solid #e0ddd6',
        width: '100%', maxWidth: 440, maxHeight: '92vh', overflowY: 'auto',
        fontFamily: font
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{isEdit ? 'עריכת תור' : 'תור חדש'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999' }} aria-label="סגור">✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 6, display: 'block' }}>לקוח *</label>
            {lockedClientId ? (
              <div style={{ fontSize: 14, padding: '8px 10px', background: '#f5f5f5', borderRadius: 8 }}>
                {(clients.find(c => c.id === lockedClientId) || {}).name || '—'}
              </div>
            ) : (
              <>
                <input
                  type="search"
                  placeholder="חיפוש לקוח..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  style={{ width: '100%', marginBottom: 8, padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }}
                  dir="rtl"
                />
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }}
                >
                  <option value="">בחר לקוח</option>
                  {filteredClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.car ? ` — ${c.car}` : ''}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>תאריך *</label>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>שעת התחלה *</label>
              <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>משך (שעה עד 8 שעות)</label>
            <select value={durationMin} onChange={e => setDurationMin(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }}>
              {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {isEdit && (
            <div>
              <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>סטטוס</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>כותרת (אופציונלי)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: פוליש חיצוני" dir="rtl" style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>הערות</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} dir="rtl" placeholder="הערות פנימיות..." style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }} />
          </div>

          {warnOverlap && (
            <p style={{ margin: 0, fontSize: 12, color: '#b45309', background: '#fffbeb', padding: '8px 10px', borderRadius: 8 }}>{warnOverlap}</p>
          )}

          {googlePreviewUrl && clientId && (
            <a
              href={googlePreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#185FA5', fontWeight: 500 }}
            >
              ↗ פתיחה ב-Google Calendar (לפי הטופס)
            </a>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '0.5px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
          <button type="button" onClick={handleSave} disabled={saving || !clientId || !dateStr} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500, borderRadius: 8,
            border: 'none', background: '#1a1a1a', color: '#fff',
            cursor: saving || !clientId || !dateStr ? 'not-allowed' : 'pointer',
            opacity: saving || !clientId || !dateStr ? 0.6 : 1
          }}>
            {saving ? 'שומר...' : isEdit ? 'עדכון' : 'שמירה'}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>ביטול</button>
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={saving} style={{ marginInlineStart: 'auto', padding: '8px 18px', fontSize: 13, borderRadius: 8, border: '1px solid #e24b4a', color: '#e24b4a', background: '#fff', cursor: 'pointer' }}>
              מחיקה
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
