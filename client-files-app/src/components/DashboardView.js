import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAppointmentsRange } from '../lib/appointments'

const font = "'Heebo', system-ui, sans-serif"

function fmt(n) {
  return '₪' + Number(n).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay()) // Sunday
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function toWaPhone(phone) {
  if (!phone) return null
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('972')) return d
  if (d.startsWith('0')) return '972' + d.slice(1)
  return '972' + d
}

const statCard = (label, value, color = '#1a1a1a') => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '0.5px solid #e0ddd6',
    padding: '16px 18px', flex: 1, minWidth: 0
  }}>
    <div style={{ fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, direction: 'ltr' }}>{value}</div>
  </div>
)

export default function DashboardView({ clients, onGoToRetention }) {
  const [todayAppts, setTodayAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
    fetchAppointmentsRange(supabase, from, to).then(({ data }) => {
      setTodayAppts(data || [])
      setLoading(false)
    })
  }, [])

  // Income stats from payments
  const allPayments = clients.flatMap(c => c.payments || [])
  const weekStart   = startOfWeek()
  const monthStart  = startOfMonth()

  const weekIncome  = allPayments.filter(p => p.date && new Date(p.date) >= weekStart).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const monthIncome = allPayments.filter(p => p.date && new Date(p.date) >= monthStart).reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  // Retention: clients who haven't paid in 60+ days
  const dueClients = clients
    .map(c => {
      const lastDate = [...(c.payments || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]?.date || null
      return { ...c, lastDate, daysSince: daysSince(lastDate) }
    })
    .filter(c => c.daysSince >= 60)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5)

  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))

  return (
    <div dir="rtl" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: font, maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>שלום 👋</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{today}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {statCard('תורים היום', loading ? '…' : todayAppts.length)}
        {statCard('הכנסה השבוע', fmt(weekIncome), '#1a6e3c')}
        {statCard('הכנסה החודש', fmt(monthIncome), '#1a6e3c')}
        {statCard('סה״כ לקוחות', clients.length)}
      </div>

      {/* Today's appointments */}
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e0ddd6', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #eee', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
          תורים היום
        </div>
        {loading ? (
          <div style={{ padding: '16px 18px', fontSize: 13, color: '#aaa' }}>טוען...</div>
        ) : todayAppts.length === 0 ? (
          <div style={{ padding: '24px 18px', fontSize: 13, color: '#aaa', textAlign: 'center' }}>אין תורים להיום 🎉</div>
        ) : (
          todayAppts.map((a, i) => {
            const client = clientMap[a.client_id]
            const time = new Date(a.start_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
            return (
              <div key={a.id} style={{
                padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
                borderTop: i > 0 ? '0.5px solid #f0ede8' : 'none'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: '#EEF5FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#378ADD', flexShrink: 0, direction: 'ltr'
                }}>{time}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{client?.name || a.title || 'לקוח'}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{client?.car || ''}{client?.location ? ' · ' + client.location : ''}</div>
                </div>
                {a.notes && <div style={{ fontSize: 11, color: '#aaa', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes}</div>}
              </div>
            )
          })
        )}
      </div>

      {/* Retention preview */}
      {dueClients.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e0ddd6', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>לקוחות שלא חזרו</div>
            <button type="button" onClick={onGoToRetention} style={{
              fontSize: 12, color: '#378ADD', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font
            }}>ראה הכל →</button>
          </div>
          {dueClients.map((c, i) => {
            const wa = toWaPhone(c.phone)
            const msg = `היי ${c.name}! 😊 עבר קצת זמן מהטיפול האחרון של הרכב שלך. נשמח לקבוע תור — bmsdetail.com`
            return (
              <div key={c.id} style={{
                padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12,
                borderTop: i > 0 ? '0.5px solid #f0ede8' : 'none'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{c.car || 'לא הוזן רכב'}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: c.daysSince >= 90 ? '#c0392b' : '#e67e22',
                  background: c.daysSince >= 90 ? '#fdf0ef' : '#fef9ec',
                  borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap'
                }}>{c.daysSince} יום</div>
                {wa && (
                  <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" style={{
                    fontSize: 11, fontWeight: 600, color: '#25D366', textDecoration: 'none',
                    background: '#f0fdf4', borderRadius: 8, padding: '5px 10px', whiteSpace: 'nowrap'
                  }}>WhatsApp</a>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
