import { useState, type FormEvent } from 'react'
import type { Lead, LeadStatus } from '../lib/types'
import { LEAD_STATUS_LABELS, type LeadInput } from '../lib/leads'
import Modal from './Modal'

const STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'booked', 'done', 'lost']

function toInput(lead: Lead | null): LeadInput {
  return {
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    source: lead?.source ?? '',
    car: lead?.car ?? '',
    city: lead?.city ?? '',
    service_interest: lead?.service_interest ?? '',
    status: lead?.status ?? 'new',
    next_followup: lead?.next_followup ?? '',
    notes: lead?.notes ?? '',
  }
}

export default function LeadForm({
  lead,
  onClose,
  onSave,
}: {
  lead: Lead | null
  onClose: () => void
  onSave: (input: LeadInput) => Promise<void>
}) {
  const [input, setInput] = useState<LeadInput>(toInput(lead))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(input)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <Modal title={lead ? 'עריכת ליד' : 'ליד חדש'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            שם
            <input value={input.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label>
            טלפון
            <input dir="ltr" value={input.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            מקור
            <input
              value={input.source}
              onChange={(e) => set('source', e.target.value)}
              placeholder="מודעה / טופס / whatsapp / הפניה"
            />
          </label>
          <label>
            סטטוס
            <select value={input.status} onChange={(e) => set('status', e.target.value as LeadStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            רכב
            <input value={input.car} onChange={(e) => set('car', e.target.value)} />
          </label>
          <label>
            עיר
            <input value={input.city} onChange={(e) => set('city', e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            תחום עניין
            <input
              value={input.service_interest}
              onChange={(e) => set('service_interest', e.target.value)}
            />
          </label>
          <label>
            מעקב הבא
            <input
              type="date"
              value={input.next_followup}
              onChange={(e) => set('next_followup', e.target.value)}
            />
          </label>
        </div>
        <label>
          הערות
          <textarea value={input.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            ביטול
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'שומר…' : 'שמירה'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
