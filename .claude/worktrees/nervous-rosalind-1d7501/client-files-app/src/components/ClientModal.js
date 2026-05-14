import { useState, useEffect } from 'react'

const font = "'Heebo', system-ui, sans-serif"

const inputStyle = {
  padding: '8px 10px', fontSize: 13, borderRadius: 8,
  border: '1px solid #ddd', width: '100%', boxSizing: 'border-box',
  fontFamily: font, background: '#fafafa'
}
const labelStyle = { fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }

export default function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', location: '', car: '', car_color: '', note: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) setForm({
      name: client.name || '',
      phone: client.phone || '',
      location: client.location || '',
      car: client.car || '',
      car_color: client.car_color || '',
      note: client.note || ''
    })
  }, [client])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div dir="rtl" style={{
        background: '#fff', borderRadius: 16, border: '0.5px solid #e0ddd6',
        width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        fontFamily: font
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '0.5px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
            {client ? 'עריכת לקוח' : 'לקוח חדש'}
          </h2>
          <button type="button" onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#999', lineHeight: 1, padding: '2px 6px'
          }} aria-label="סגור">✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>שם מלא *</label>
              <input style={inputStyle} placeholder="ישראל ישראלי" value={form.name} onChange={e => set('name', e.target.value)} dir="rtl" />
            </div>
            <div>
              <label style={labelStyle}>טלפון</label>
              <input style={inputStyle} placeholder="050-1234567" value={form.phone} onChange={e => set('phone', e.target.value)} dir="rtl" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>כתובת / אזור</label>
            <input style={inputStyle} placeholder="עיר, רחוב" value={form.location} onChange={e => set('location', e.target.value)} dir="rtl" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>דגם רכב</label>
              <input style={inputStyle} placeholder="טויוטה קורולה 2020" value={form.car} onChange={e => set('car', e.target.value)} dir="rtl" />
            </div>
            <div>
              <label style={labelStyle}>צבע רכב</label>
              <input style={inputStyle} placeholder="לבן פנינה" value={form.car_color} onChange={e => set('car_color', e.target.value)} dir="rtl" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>פרט אישי <span style={{ color: '#378ADD', fontWeight: 400 }}>(לשאול בביקור הבא)</span></label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
              placeholder="למשל: כלב גולדן בשם מקס. מעדיף תורים בבוקר..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
              dir="rtl"
            />
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: '0.5px solid #eee',
          display: 'flex', justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap'
        }}>
          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500, borderRadius: 8,
            border: 'none', background: '#1a1a1a', color: '#fff',
            cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !form.name.trim() ? 0.6 : 1
          }}>
            {saving ? 'שומר...' : 'שמירה'}
          </button>
          <button type="button" onClick={onClose} style={{
            padding: '8px 18px', fontSize: 13, borderRadius: 8,
            border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer'
          }}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
