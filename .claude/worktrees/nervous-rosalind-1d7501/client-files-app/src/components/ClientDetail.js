import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatIls, formatDateHe } from '../lib/format'
import PaymentModal from './PaymentModal'

const font = "'Heebo', system-ui, sans-serif"

function initials(name) {
  if (!name || !name.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const avatarPalettes = [
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#E1F5EE', color: '#0F6E56' },
  { bg: '#FBEAF0', color: '#993556' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EEEDFE', color: '#534AB7' },
]
function avatarColor(name) {
  const key = (name && name[0]) ? name.charCodeAt(0) : 0
  return avatarPalettes[key % avatarPalettes.length]
}

/** תוויות ישנות באנגלית מהמסד + עברית */
const PHOTO_LABEL_HE = {
  Before: 'לפני',
  After: 'אחרי',
  Detail: 'פירוט',
  Other: 'אחר',
  לפני: 'לפני',
  אחרי: 'אחרי',
  פירוט: 'פירוט',
  אחר: 'אחר'
}

function photoLabelDisplay(label) {
  if (!label) return ''
  return PHOTO_LABEL_HE[label] || label
}

export default function ClientDetail({ client, onEdit, onDelete, onRefresh, onScheduleAppointment }) {
  const [showPayment, setShowPayment] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoType, setPhotoType] = useState('לפני')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleting, setDeleting] = useState(false)

  if (!client) return null

  const pal = avatarColor(client.name)
  const payments = client.payments || []
  const photos = client.photos || []
  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  const handleAddPayment = async (paymentData) => {
    await supabase.from('payments').insert({
      client_id: client.id,
      amount: paymentData.amount,
      date: paymentData.date,
      description: paymentData.description
    })
    setShowPayment(false)
    onRefresh()
  }

  const handleDeletePayment = async (id) => {
    if (!window.confirm('להסיר את התשלום הזה?')) return
    await supabase.from('payments').delete().eq('id', id)
    onRefresh()
  }

  const handlePhotoUpload = async () => {
    if (!selectedFile) return
    setUploadingPhoto(true)
    const ext = selectedFile.name.split('.').pop()
    const filename = `${client.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('client-photos').upload(filename, selectedFile)
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('client-photos').getPublicUrl(filename)
      await supabase.from('photos').insert({
        client_id: client.id,
        url: urlData.publicUrl,
        label: photoType
      })
      onRefresh()
    }
    setUploadingPhoto(false)
    setShowPhotoModal(false)
    setSelectedFile(null)
  }

  const handleDeletePhoto = async (id, url) => {
    if (!window.confirm('למחוק את התמונה?')) return
    const path = url.split('/client-photos/')[1]
    await supabase.storage.from('client-photos').remove([path])
    await supabase.from('photos').delete().eq('id', id)
    onRefresh()
  }

  const handleDelete = async () => {
    if (!window.confirm(`למחוק את תיק הלקוח של ${client.name}? לא ניתן לבטל.`)) return
    setDeleting(true)
    await supabase.from('payments').delete().eq('client_id', client.id)
    for (const ph of photos) {
      const path = ph.url.split('/client-photos/')[1]
      if (path) await supabase.storage.from('client-photos').remove([path])
    }
    await supabase.from('photos').delete().eq('client_id', client.id)
    await supabase.from('clients').delete().eq('id', client.id)
    onDelete()
  }

  const photoTypes = ['לפני', 'אחרי', 'פירוט', 'אחר']

  return (
    <div dir="rtl" style={{ padding: 28, fontFamily: font, maxWidth: 720 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 22, borderBottom: '0.5px solid #eee' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: pal.bg, color: pal.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 20, flexShrink: 0
        }}>{initials(client.name)}</div>
        <div style={{ minWidth: 0, flex: 1, textAlign: 'start' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>{client.name}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
            {client.car}{client.car_color ? ` · ${client.car_color}` : ''}
          </div>
        </div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={onEdit} style={{ padding: '7px 16px', fontSize: 12, borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer' }}>עריכה</button>
          <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '7px 16px', fontSize: 12, borderRadius: 8, border: '0.5px solid #e24b4a', color: '#e24b4a', background: '#fff', cursor: 'pointer' }}>
            {deleting ? 'מוחק...' : 'מחיקה'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        {[
          { title: 'יצירת קשר', rows: [['טלפון', client.phone || '—'], ['מיקום', client.location || '—']] },
          { title: 'רכב', rows: [['דגם', client.car || '—'], ['צבע', client.car_color || '—']] }
        ].map(card => (
          <div key={card.title} style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em', marginBottom: 12 }}>{card.title}</div>
            {card.rows.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f0f0f0' }}>
                <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500, maxWidth: '58%', textAlign: 'start', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {typeof onScheduleAppointment === 'function' && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={onScheduleAppointment}
            style={{
              padding: '10px 16px', fontSize: 13, borderRadius: 10, border: '0.5px solid #378ADD',
              background: '#fff', color: '#185FA5', cursor: 'pointer', fontWeight: 600, width: '100%'
            }}
          >
            📅 קביעת תור
          </button>
        </div>
      )}

      {client.note && (
        <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em' }}>פרט אישי</span>
            <span style={{ fontSize: 10, background: '#E6F1FB', color: '#185FA5', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>לשאול בביקור הבא</span>
          </div>
          <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6, background: '#fafafa', borderRadius: 8, padding: '10px 12px', textAlign: 'start' }}>{client.note}</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em', marginBottom: 12 }}>תמונות</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {photos.map(ph => (
            <div key={ph.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '0.5px solid #eee', cursor: 'pointer' }}
              onClick={() => window.open(ph.url, '_blank')}>
              <img src={ph.url} alt={photoLabelDisplay(ph.label)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, padding: '3px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
                <span>{photoLabelDisplay(ph.label)}</span>
                <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); handleDeletePhoto(ph.id, ph.url) }} onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), handleDeletePhoto(ph.id, ph.url))} style={{ cursor: 'pointer', opacity: 0.8 }}>✕</span>
              </div>
            </div>
          ))}
          <div onClick={() => setShowPhotoModal(true)} style={{
            aspectRatio: '1', borderRadius: 8, border: '0.5px dashed #ccc',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, cursor: 'pointer', color: '#aaa', fontSize: 11
          }}>
            <span style={{ fontSize: 22 }}>+</span>
            <span>הוספת תמונה</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em', marginBottom: 12 }}>היסטוריית תשלומים</div>
        {payments.length === 0 && <div style={{ fontSize: 13, color: '#aaa', padding: '6px 0' }}>אין תשלומים עדיין</div>}
        {payments.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' }}>
            <div style={{ minWidth: 0, textAlign: 'start' }}>
              <div style={{ fontSize: 13, color: '#1a1a1a' }}>{p.description || 'שירות'}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{formatDateHe(p.date)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F6E56' }}>{formatIls(p.amount)}</span>
              <button type="button" onClick={() => handleDeletePayment(p.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 13 }} aria-label="מחק תשלום">✕</button>
            </div>
          </div>
        ))}
        {payments.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee' }}>
            <span style={{ fontSize: 13, color: '#888' }}>סה״כ שולם</span>
            <strong style={{ fontSize: 16 }}>{formatIls(total)}</strong>
          </div>
        )}
        <button type="button" onClick={() => setShowPayment(true)} style={{
          marginTop: 14, padding: '7px 16px', fontSize: 12, borderRadius: 8,
          border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer'
        }}>+ הוספת תשלום</button>
      </div>

      {showPayment && <PaymentModal onSave={handleAddPayment} onClose={() => setShowPayment(false)} />}

      {showPhotoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20
        }} onClick={e => e.target === e.currentTarget && setShowPhotoModal(false)}>
          <div dir="rtl" style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e0ddd6', width: '100%', maxWidth: 380, fontFamily: font }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>הוספת תמונה</h2>
              <button type="button" onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999' }} aria-label="סגור">✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>סוג תמונה</label>
                <select value={photoType} onChange={e => setPhotoType(e.target.value)} style={{ padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', width: '100%', background: '#fafafa' }}>
                  {photoTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4, display: 'block' }}>בחירת קובץ</label>
                <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} style={{ fontSize: 13 }} />
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={handlePhotoUpload} disabled={!selectedFile || uploadingPhoto} style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 500, borderRadius: 8,
                border: 'none', background: '#1a1a1a', color: '#fff',
                cursor: !selectedFile || uploadingPhoto ? 'not-allowed' : 'pointer',
                opacity: !selectedFile || uploadingPhoto ? 0.6 : 1
              }}>
                {uploadingPhoto ? 'מעלה...' : 'הוספה'}
              </button>
              <button type="button" onClick={() => setShowPhotoModal(false)} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
