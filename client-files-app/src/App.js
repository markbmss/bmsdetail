import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import ClientModal from './components/ClientModal'
import ClientDetail from './components/ClientDetail'
import CalendarView from './components/CalendarView'
import AppointmentModal from './components/AppointmentModal'
import { fetchAppointmentsRange } from './lib/appointments'
import { startOfWeekSunday, addWeeks, endOfWeekSaturday } from './lib/weekUtils'

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

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('app_auth') === 'true')
  const [activeView, setActiveView] = useState('clients')
  const [clients, setClients] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [loading, setLoading] = useState(true)

  const [calendarWeekStart, setCalendarWeekStart] = useState(() => startOfWeekSunday())
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentEdit, setAppointmentEdit] = useState(null)
  const [appointmentLockedClientId, setAppointmentLockedClientId] = useState(null)
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState(null)

  useEffect(() => {
    if (authed) loadClients()
  }, [authed])

  useEffect(() => {
    if (!authed || activeView !== 'calendar') return
    let cancelled = false
    ;(async () => {
      setAppointmentsLoading(true)
      const from = calendarWeekStart
      const to = endOfWeekSaturday(addWeeks(from, 2))
      const { data } = await fetchAppointmentsRange(supabase, from.toISOString(), to.toISOString())
      if (!cancelled) {
        setAppointments(data || [])
        setAppointmentsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [authed, activeView, calendarWeekStart])

  async function loadClients() {
    setLoading(true)
    const { data: clientData } = await supabase.from('clients').select('*').order('name')
    const { data: paymentData } = await supabase.from('payments').select('*').order('date', { ascending: false })
    const { data: photoData } = await supabase.from('photos').select('*').order('created_at')
    const enriched = (clientData || []).map(c => ({
      ...c,
      payments: (paymentData || []).filter(p => p.client_id === c.id),
      photos: (photoData || []).filter(p => p.client_id === c.id)
    }))
    setClients(enriched)
    setLoading(false)
  }

  async function reloadAppointments() {
    const from = calendarWeekStart
    const to = endOfWeekSaturday(addWeeks(from, 2))
    const { data } = await fetchAppointmentsRange(supabase, from.toISOString(), to.toISOString())
    setAppointments(data || [])
  }

  const q = search.trim().toLowerCase()
  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.car || '').toLowerCase().includes(q)
  )

  const activeClient = clients.find(c => c.id === activeId) || null

  async function handleSaveClient(form) {
    if (editingClient) {
      const { error } = await supabase.from('clients').update(form).eq('id', editingClient.id)
      if (error) { alert('שגיאה בעדכון לקוח:\n' + error.message); return }
    } else {
      const { data, error } = await supabase.from('clients').insert(form).select().single()
      if (error) { alert('שגיאה בשמירת לקוח:\n' + error.message); return }
      if (data) setActiveId(data.id)
    }
    setShowModal(false)
    setEditingClient(null)
    await loadClients()
  }

  function openAdd() { setEditingClient(null); setShowModal(true) }
  function openEdit(client) { setEditingClient(client); setShowModal(true) }

  function openNewAppointment(date, lockedClientId) {
    setAppointmentEdit(null)
    setAppointmentLockedClientId(lockedClientId || null)
    setAppointmentDefaultDate(date || new Date())
    setShowAppointmentModal(true)
  }

  function openEditAppointment(appt) {
    setAppointmentEdit(appt)
    setAppointmentLockedClientId(appt.client_id)
    setAppointmentDefaultDate(new Date(appt.start_at))
    setShowAppointmentModal(true)
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />
  }

  const clientCountLabel = clients.length === 1 ? 'לקוח אחד' : `${clients.length} לקוחות`

  const tabStyle = (active) => ({
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    border: 'none',
    borderBottom: active ? '2px solid #378ADD' : '2px solid transparent',
    marginBottom: -1,
    background: 'transparent',
    cursor: 'pointer',
    color: active ? '#1a1a1a' : '#666',
    fontFamily: font
  })

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: font, background: '#f5f4f1' }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '0.5px solid #e0ddd6', background: '#fafaf8', flexShrink: 0, paddingInline: 8 }}>
        <button type="button" style={tabStyle(activeView === 'clients')} onClick={() => setActiveView('clients')}>קבצי לקוחות</button>
        <button type="button" style={tabStyle(activeView === 'calendar')} onClick={() => setActiveView('calendar')}>יומן</button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {activeView === 'clients' ? (
          <>
            <div style={{
              width: 260, minWidth: 260, background: '#fafaf8',
              borderInlineEnd: '0.5px solid #e0ddd6',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ padding: '18px 16px 14px', borderBottom: '0.5px solid #eee' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>קבצי לקוחות</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{clientCountLabel}</div>
              </div>

              <div style={{ padding: '10px 12px', borderBottom: '0.5px solid #eee' }}>
                <input
                  type="search"
                  placeholder="חיפוש לפי שם או רכב..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  dir="rtl"
                  style={{
                    width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 8,
                    border: '0.5px solid #ddd', background: '#fff', boxSizing: 'border-box', color: '#1a1a1a'
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {loading ? (
                  <div style={{ padding: '20px 16px', fontSize: 13, color: '#aaa' }}>טוען...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '20px 16px', fontSize: 13, color: '#aaa', textAlign: 'center' }}>לא נמצאו לקוחות</div>
                ) : filtered.map(c => {
                  const pal = avatarColor(c.name)
                  return (
                    <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      background: c.id === activeId ? '#fff' : 'transparent',
                      borderInlineStart: c.id === activeId ? '2px solid #378ADD' : '2px solid transparent',
                      transition: 'background 0.1s'
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: pal.bg, color: pal.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0
                      }}>{initials(c.name)}</div>
                      <div style={{ overflow: 'hidden', minWidth: 0, flex: 1, textAlign: 'start' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.car || 'לא הוזן רכב'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '12px 14px', borderTop: '0.5px solid #eee', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button type="button" onClick={openAdd} style={{
                  padding: '9px', fontSize: 13, borderRadius: 8,
                  border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer', color: '#1a1a1a', fontWeight: 500
                }}>+ לקוח חדש</button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('app_auth')
                    setAuthed(false)
                  }}
                  style={{
                    padding: '7px', fontSize: 12, borderRadius: 8,
                    border: 'none', background: 'none', cursor: 'pointer', color: '#aaa'
                  }}
                >
                  יציאה
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#f5f4f1', minWidth: 0 }}>
              {!activeClient ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#aaa' }}>
                  <div style={{ fontSize: 40 }}>📁</div>
                  <div style={{ fontSize: 14 }}>לא נבחר לקוח</div>
                  <div style={{ fontSize: 12 }}>הוסף לקוח או בחר מהרשימה</div>
                </div>
              ) : (
                <ClientDetail
                  client={activeClient}
                  onEdit={() => openEdit(activeClient)}
                  onDelete={() => { setActiveId(null); loadClients() }}
                  onRefresh={loadClients}
                  onScheduleAppointment={() => openNewAppointment(new Date(), activeClient.id)}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: '#f5f4f1' }}>
            <CalendarView
              weekStart={calendarWeekStart}
              onPrevWeek={() => setCalendarWeekStart(w => addWeeks(w, -1))}
              onNextWeek={() => setCalendarWeekStart(w => addWeeks(w, 1))}
              appointments={appointments}
              clients={clients}
              loading={appointmentsLoading}
              onSelectAppointment={openEditAppointment}
              onNewAppointment={(d) => openNewAppointment(d, null)}
            />
          </div>
        )}
      </div>

      {showModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => { setShowModal(false); setEditingClient(null) }}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          open={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false)
            setAppointmentEdit(null)
            setAppointmentLockedClientId(null)
            setAppointmentDefaultDate(null)
          }}
          clients={clients}
          appointment={appointmentEdit}
          lockedClientId={appointmentLockedClientId}
          defaultDate={appointmentDefaultDate}
          existingAppointments={appointments}
          onSaved={() => {
            reloadAppointments()
            loadClients()
          }}
        />
      )}
    </div>
  )
}
