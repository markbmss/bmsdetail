import { useState, type FormEvent } from 'react'
import type { Customer } from '../lib/types'
import type { CustomerInput } from '../lib/customers'
import Modal from './Modal'

function toInput(customer: Customer | null): CustomerInput {
  return {
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    city: customer?.city ?? '',
    notes: customer?.notes ?? '',
  }
}

export default function CustomerForm({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer | null
  onClose: () => void
  onSave: (input: CustomerInput) => Promise<void>
}) {
  const [input, setInput] = useState<CustomerInput>(toInput(customer))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
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
    <Modal title={customer ? 'עריכת לקוח' : 'לקוח חדש'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          שם *
          <input value={input.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <div className="form-row">
          <label>
            טלפון
            <input dir="ltr" value={input.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label>
            אימייל
            <input dir="ltr" value={input.email} onChange={(e) => set('email', e.target.value)} />
          </label>
        </div>
        <label>
          עיר
          <input value={input.city} onChange={(e) => set('city', e.target.value)} />
        </label>
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
