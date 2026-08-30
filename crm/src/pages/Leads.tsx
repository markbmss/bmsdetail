import { useEffect, useState } from 'react'
import type { Lead, LeadStatus } from '../lib/types'
import { fetchLeads, createLead, updateLead, convertLead, type LeadInput, type ConvertInput } from '../lib/leads'
import { waLink } from '../lib/dates'
import LeadForm from '../components/LeadForm'
import ConvertLeadModal from '../components/ConvertLeadModal'

const FILTERS: Array<LeadStatus | 'all'> = ['all', 'new', 'contacted', 'quoted', 'booked', 'done', 'lost']

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')

  const [editing, setEditing] = useState<Lead | null>(null)
  const [creating, setCreating] = useState(false)
  const [converting, setConverting] = useState<Lead | null>(null)

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

  const visible = filter === 'all' ? leads : leads.filter((l) => l.status === filter)

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div className="leads-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={f === filter ? 'filter-btn filter-btn-active' : 'filter-btn'}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setCreating(true)}>+ New lead</button>
      </div>

      {loading && <p className="today-status">Loading leads…</p>}
      {error && <p className="today-status today-error">Error: {error}</p>}

      {!loading && !error && (
        <ul className="leads-list">
          {visible.length === 0 && <p className="reminder-empty">No leads in this view.</p>}
          {visible.map((lead) => {
            const phone = waLink(lead.phone)
            const canConvert = !lead.customer_id && lead.status !== 'lost'
            return (
              <li key={lead.id} className="lead-row">
                <div className="lead-row-main" onClick={() => setEditing(lead)}>
                  <span className="lead-row-name">{lead.name ?? 'Unnamed lead'}</span>
                  <span className="lead-row-meta">
                    {[lead.city, lead.service_interest, lead.source].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className={`status-badge status-${lead.status}`}>{lead.status}</span>
                {lead.customer_id && <span className="converted-badge">converted</span>}
                {phone && (
                  <a className="reminder-row-wa" href={phone} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                )}
                {canConvert && (
                  <button className="btn-secondary" onClick={() => setConverting(lead)}>
                    Convert
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
    </div>
  )
}
