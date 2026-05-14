import { useState } from 'react'

const font = "'Heebo', system-ui, sans-serif"

const inputStyle = {
  padding: '8px 10px', fontSize: 13, borderRadius: 8,
  border: '1px solid #ddd', width: '100%', boxSizing: 'border-box',
  fontFamily: font, background: '#fafafa'
}
const labelStyle = { fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }

function parseAmountInput(raw) {
  if (raw == null || raw === '') return NaN
  const normalized = String(raw).trim().replace(',', '.')
  return parseFloat(normalized)
}

export default function PaymentModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const n = parseAmountInput(form.amount)
    if (Number.isNaN(n) || n <= 0) return
    setSaving(true)
    await onSave({ ...form, amount: n.toFixed(2) })
    setSaving(false)
  }

  const amountNum = parseAmountInput(form.amount)
  const amountOk = form.amount !== '' && !Number.isNaN(amountNum) && amountNum > 0

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 20
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div dir="rtl" style={{
        background: '#fff', borderRadius: 16, border: '0.5px solid #e0ddd6',
        width: '100%', maxWidth: 400, fontFamily: font
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '0.5px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>הוספת תשלום</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999' }} aria-label="סגור">✕</button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>סכום (₪ / ILS)</label>
              <input
                style={inputStyle}
                type="text"
                inputMode="decimal"
                placeholder="למשל 350 או 350.50"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label style={labelStyle}>תאריך</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>תיאור / שירות</label>
            <input style={inputStyle} placeholder="שטיפה, פוליש, ציפוי קרמי..." value={form.description} onChange={e => set('description', e.target.value)} dir="rtl" />
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleSave} disabled={saving || !amountOk} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 500, borderRadius: 8,
            border: 'none', background: '#1a1a1a', color: '#fff',
            cursor: saving || !amountOk ? 'not-allowed' : 'pointer',
            opacity: saving || !amountOk ? 0.6 : 1
          }}>
            {saving ? 'שומר...' : 'הוספת תשלום'}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
