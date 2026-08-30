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
    <Modal title={car ? 'Edit car' : 'Add car'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Make / model
          <input value={input.make_model} onChange={(e) => set('make_model', e.target.value)} />
        </label>
        <div className="form-row">
          <label>
            Plate
            <input value={input.plate} onChange={(e) => set('plate', e.target.value)} />
          </label>
          <label>
            Color
            <input value={input.color} onChange={(e) => set('color', e.target.value)} />
          </label>
          <label>
            Year
            <input type="number" value={input.year} onChange={(e) => set('year', e.target.value)} />
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
