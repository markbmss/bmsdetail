import { useState, type FormEvent } from 'react'
import type { Car } from '../lib/types'
import type { CarInput } from '../lib/customers'
import Modal from './Modal'

function toInput(car: Car | null): CarInput {
  return {
    make_model: car?.make_model ?? '',
    plate: car?.plate ?? '',
    color: car?.color ?? '',
    year: car?.year != null ? String(car.year) : '',
    notes: car?.notes ?? '',
  }
}

export default function CarForm({
  car,
  onClose,
  onSave,
}: {
  car: Car | null
  onClose: () => void
  onSave: (input: CarInput) => Promise<void>
}) {
  const [input, setInput] = useState<CarInput>(toInput(car))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CarInput>(key: K, value: CarInput[K]) {
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
    <Modal title={car ? 'עריכת רכב' : 'הוספת רכב'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          יצרן / דגם
          <input value={input.make_model} onChange={(e) => set('make_model', e.target.value)} />
        </label>
        <div className="form-row">
          <label>
            מספר רישוי
            <input value={input.plate} onChange={(e) => set('plate', e.target.value)} />
          </label>
          <label>
            צבע
            <input value={input.color} onChange={(e) => set('color', e.target.value)} />
          </label>
          <label>
            שנה
            <input type="number" value={input.year} onChange={(e) => set('year', e.target.value)} />
          </label>
        </div>
        <label>
          הערות
          <textarea value={input.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
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
