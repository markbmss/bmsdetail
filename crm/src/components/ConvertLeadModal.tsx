import { useState, type FormEvent } from 'react'
import type { Lead } from '../lib/types'
import type { ConvertInput } from '../lib/leads'
import Modal from './Modal'

export default function ConvertLeadModal({
  lead,
  onClose,
  onConvert,
}: {
  lead: Lead
  onClose: () => void
  onConvert: (input: ConvertInput) => Promise<void>
}) {
  const [input, setInput] = useState<ConvertInput>({
    customerName: lead.name ?? '',
    customerPhone: lead.phone ?? '',
    customerCity: lead.city ?? '',
    carMakeModel: lead.car ?? '',
    createJob: false,
    jobService: lead.service_interest ?? '',
    jobPrice: '',
    jobDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof ConvertInput>(key: K, value: ConvertInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onConvert(input)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Convert lead: ${lead.name ?? 'Unnamed'}`} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <p className="form-hint">Creates a customer + car from this lead and links it.</p>
        <div className="form-row">
          <label>
            Customer name
            <input
              value={input.customerName}
              onChange={(e) => set('customerName', e.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input value={input.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            City
            <input value={input.customerCity} onChange={(e) => set('customerCity', e.target.value)} />
          </label>
          <label>
            Car
            <input value={input.carMakeModel} onChange={(e) => set('carMakeModel', e.target.value)} />
          </label>
        </div>

        <label className="form-checkbox">
          <input
            type="checkbox"
            checked={input.createJob}
            onChange={(e) => set('createJob', e.target.checked)}
          />
          Also create a first job
        </label>

        {input.createJob && (
          <div className="form-row">
            <label>
              Service
              <input value={input.jobService} onChange={(e) => set('jobService', e.target.value)} />
            </label>
            <label>
              Price
              <input
                type="number"
                value={input.jobPrice}
                onChange={(e) => set('jobPrice', e.target.value)}
              />
            </label>
            <label>
              Date
              <input type="date" value={input.jobDate} onChange={(e) => set('jobDate', e.target.value)} />
            </label>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'Converting…' : 'Convert'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
