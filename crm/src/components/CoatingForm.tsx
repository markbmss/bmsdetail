import { useState, type FormEvent } from 'react'
import type { Coating } from '../lib/types'
import type { CoatingInput } from '../lib/customers'
import Modal from './Modal'

function toInput(coating: Coating | null): CoatingInput {
  return {
    product: coating?.product ?? '',
    applied_date: coating?.applied_date ?? '',
    warranty_months: coating ? String(coating.warranty_months) : '36',
    booster_interval_days: coating ? String(coating.booster_interval_days) : '90',
    last_booster_date: coating?.last_booster_date ?? '',
    notes: coating?.notes ?? '',
  }
}

export default function CoatingForm({
  coating,
  onClose,
  onSave,
}: {
  coating: Coating | null
  onClose: () => void
  onSave: (input: CoatingInput) => Promise<void>
}) {
  const [input, setInput] = useState<CoatingInput>(toInput(coating))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CoatingInput>(key: K, value: CoatingInput[K]) {
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
    <Modal title={coating ? 'Edit coating' : 'Add coating'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Product
          <input
            value={input.product}
            onChange={(e) => set('product', e.target.value)}
            placeholder="e.g. 3D Graphene 3yr"
          />
        </label>
        <div className="form-row">
          <label>
            Applied date
            <input
              type="date"
              value={input.applied_date}
              onChange={(e) => set('applied_date', e.target.value)}
            />
          </label>
          <label>
            Last booster date
            <input
              type="date"
              value={input.last_booster_date}
              onChange={(e) => set('last_booster_date', e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Warranty (months)
            <input
              type="number"
              value={input.warranty_months}
              onChange={(e) => set('warranty_months', e.target.value)}
            />
          </label>
          <label>
            Booster interval (days)
            <input
              type="number"
              value={input.booster_interval_days}
              onChange={(e) => set('booster_interval_days', e.target.value)}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea value={input.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
