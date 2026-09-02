import { useEffect, useState } from 'react'
import type { Lead, LeadStatus } from '../lib/types'
import {
  fetchLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  convertLead,
  isFollowupDue,
  leadStatusLabel,
  type LeadInput,
  type ConvertInput,
} from '../lib/leads'
import { waLink, callLink, relativeTime } from '../lib/dates'
import LeadForm from '../components/LeadForm'
import ConvertLeadModal from '../components/ConvertLeadModal'
import ImportLeadsModal from '../components/ImportLeadsModal'
import LeadsBoard from '../components/LeadsBoard'

const FILTERS: Array<LeadStatus | 'all'> = ['all', 'new', 'contacted', 'quoted', 'booked', 'done', 'lost']
const FILTER_LABELS: Record<LeadStatus | 'all', string> = {
  all: 'הכל',
  new: 'חדש',
  contacted: 'בטיפול',
  quoted: 'הצעת מחיר',
  booked: 'נקבע',
  done: 'הושלם',
  lost: 'אבוד',
}

type View = 'board' | 'list'

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('board')

  const [editing, setEditing] = useState<Lead | null>(null)
  const [creating, setCreating] = useState(false)
  const [converting, setConverting] = useState<Lead | null>(null)
  const [importing, setImporting] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      setLeads(await fetchLeads())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleCreate(input: LeadInput) {
    await createLead(input)
    setCreating(false)
    await reload()
  }

  async function handleUpdate(input: LeadInput) {
    if (!editing) return
    await updateLead(editing.id, input)
    setEditing(null)
    await reload()
  }

  async function handleConvert(input: ConvertInput) {
    if (!converting) return
    await convertLead(converting, input)
    setConverting(null)
    await reload()
  }

  async function handleStatusChange(id: string, status: LeadStatus) {
    const previous = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    try {
      await updateLeadStatus(id, status)
    } catch (err) {
      setLeads(previous)
      setError((err as Error).message)
    }
  }

  const searched = search.trim()
    ? leads.filter(
        (l) =>
          (l.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (l.phone ?? '').includes(search) ||
          (l.city ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : leads
  const visible = filter === 'all' ? searched : searched.filter((l) => l.status === filter)

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div className="leads-filters">
          <div className="view-toggle">
            <button
              className={view === 'board' ? 'filter-btn filter-btn-active' : 'filter-btn'}
              onClick={() => setView('board')}
            >
              לוח
            </button>
            <button
              className={view === 'list' ? 'filter-btn filter-btn-active' : 'filter-btn'}
              onClick={() => setView('list')}
            >
              רשימה
            </button>
          </div>
          {view === 'list' &&
            FILTERS.map((f) => (
              <button
                key={f}
                className={f === filter ? 'filter-btn filter-btn-active' : 'filter-btn'}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
        </div>
        <div className="leads-header-actions">
          <input
            className="customers-search"
            placeholder="חיפוש לפי שם, טלפון או עיר…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={() => setImporting(true)}>
            ייבוא CSV
          </button>
          <button onClick={() => setCreating(true)}>+ ליד חדש</button>
        </div>
      </div>

      {loading && <p className="today-status">טוען לידים…</p>}
      {error && <p className="today-status today-error">שגיאה: {error}</p>}

      {!loading && !error && view === 'board' && (
        <LeadsBoard
          leads={searched}
          onStatusChange={handleStatusChange}
          onOpenLead={setEditing}
          onConvert={setConverting}
        />
      )}

      {!loading && !error && view === 'list' && (
        <ul className="leads-list">
          {visible.length === 0 && <p className="reminder-empty">אין לידים בתצוגה זו.</p>}
          {visible.map((lead) => {
            const wa = waLink(lead.phone)
            const call = callLink(lead.phone)
            const canConvert = !lead.customer_id && lead.status !== 'lost'
            return (
              <li key={lead.id} className="lead-row">
                <div className="lead-row-main" onClick={() => setEditing(lead)}>
                  <span className="lead-row-name">
                    {isFollowupDue(lead) && <span className="urgency-dot" title="מעקב לביצוע" />}
                    {lead.name ?? 'ליד ללא שם'}
                  </span>
                  <span className="lead-row-meta">
                    {[lead.city, lead.service_interest, lead.source].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className="reminder-row-due">{relativeTime(lead.created_at)}</span>
                <span className={`status-badge status-${lead.status}`}>{leadStatusLabel(lead.status)}</span>
                {lead.customer_id && <span className="converted-badge">הומר</span>}
                {call && (
                  <a className="reminder-row-call" href={call} title="התקשר">
                    התקשר
                  </a>
                )}
                {wa && (
                  <a className="reminder-row-wa" href={wa} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                )}
                {canConvert && (
                  <button className="btn-secondary" onClick={() => setConverting(lead)}>
                    המרה
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {creating && <LeadForm lead={null} onClose={() => setCreating(false)} onSave={handleCreate} />}
      {editing && <LeadForm lead={editing} onClose={() => setEditing(null)} onSave={handleUpdate} />}
      {converting && (
        <ConvertLeadModal lead={converting} onClose={() => setConverting(null)} onConvert={handleConvert} />
      )}
      {importing && (
        <ImportLeadsModal
          onClose={() => setImporting(false)}
          onDone={() => {
            setImporting(false)
            reload()
          }}
        />
      )}
    </div>
  )
}
