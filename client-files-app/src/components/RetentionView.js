import { useState } from 'react'

const font = "'Heebo', system-ui, sans-serif"

function daysSince(dateStr) {
  if (!dateStr) return Infinity
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function toWaPhone(phone) {
  if (!phone) return null
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('972')) return d
  if (d.startsWith('0')) return '972' + d.slice(1)
  return '972' + d
}

function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

const palettes = [
  { bg: '#E6F1FB', color: '#185FA5' }, { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#FBEAF0', color: '#993556' }, { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EEEDFE', color: '#534AB7' },
]
function pal(name) { return palettes[(name?.charCodeAt(0) || 0) % palettes.length] }

const THRESHOLDS = [30, 60, 90]

export default function RetentionView({ clients }) {
  const [threshold, setThreshold] = useState(60)

  const rows = clients
    .map(c => {
      const sorted = [...(c.payments || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      const lastDate = sorted[0]?.date || null
      const lastDesc = sorted[0]?.description || null
      return { ...c, lastDate, lastDesc, days: daysSince(lastDate) }
    })
    .filter(c => c.days >= threshold)
    .sort((a, b) => b.days - a.days)

  return (
    <div dir="rtl" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontFamily: font, maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>לקוחות לטיפול</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{rows.length} לקוחות לא חזרו מעל {threshold} יום</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {THRESHOLDS.map(t => (
            <button key={t} type="button" onClick={() => setThreshold(t)} style={{
              padding: '6px 14px', fontSize: 12, borderRadius: 20, fontFamily: font,
              border: t === threshold ? 'none' : '0.5px solid #ddd',
              background: t === threshold ? '#1a1a1a' : '#fff',
              color: t === threshold ? '#fff' : '#555',
              cursor: 'pointer', fontWeight: t === threshold ? 600 : 400
            }}>{t}+ יום</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e0ddd6', overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            כל הלקוחות חזרו לאחרונה
          </div>
        ) : rows.map((c, i) => {
          const p = pal(c.name)
          const wa = toWaPhone(c.phone)
          const msg = `היי ${c.name}! 😊 עבר קצת זמן מהטיפול האחרון של הרכב שלך. נשמח לקבוע תור — bmsdetail.com`
          const urgent = c.days >= 90

          return (
            <div key={c.id} style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
              borderTop: i > 0 ? '0.5px solid #f0ede8' : 'none',
              background: urgent ? '#fffaf9' : '#fff'
            }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: p.bg, color: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, flexShrink: 0
              }}>{initials(c.name)}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {c.car || 'לא הוזן רכב'}
                  {c.lastDate ? ' · טיפול אחרון: ' + new Date(c.lastDate).toLocaleDateString('he-IL') : ' · אין טיפולים'}
                  {c.lastDesc ? ' (' + c.lastDesc + ')' : ''}
                </div>
              </div>

              {/* Days badge */}
              <div style={{
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                color: urgent ? '#c0392b' : '#e67e22',
                background: urgent ? '#fdf0ef' : '#fef9ec',
                borderRadius: 20, padding: '4px 12px'
              }}>{c.days === Infinity ? 'לא טופל' : c.days + ' יום'}</div>

              {/* Phone */}
              {c.phone && (
                <a href={`tel:${c.phone}`} style={{ fontSize: 11, color: '#555', textDecoration: 'none', whiteSpace: 'nowrap' }}>{c.phone}</a>
              )}

              {/* WhatsApp */}
              {wa ? (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" style={{
                  fontSize: 12, fontWeight: 600, color: '#25D366', textDecoration: 'none',
                  background: '#f0fdf4', border: '0.5px solid #bbf7d0',
                  borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0
                }}>💬 WhatsApp</a>
              ) : (
                <div style={{ fontSize: 11, color: '#ddd', whiteSpace: 'nowrap' }}>אין טלפון</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
