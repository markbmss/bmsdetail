import { useState, type ChangeEvent } from 'react'
import Modal from './Modal'
import {
  parseCsv,
  guessMapping,
  importLeads,
  type ParsedCsv,
  type ColumnMapping,
  type ImportResult,
} from '../lib/csvImport'

const FIELDS: Array<{ key: keyof ColumnMapping; label: string; required: boolean }> = [
  { key: 'id', label: 'Meta lead ID (for de-dup on re-import)', required: false },
  { key: 'createdTime', label: 'Created time (for accurate "time joined")', required: false },
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'car', label: 'Car', required: false },
  { key: 'serviceInterest', label: 'Service interest', required: false },
]

export default function ImportLeadsModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const csv = parseCsv(text)
        if (csv.rows.length === 0) {
          setError('No rows found in that CSV.')
          return
        }
        setParsed(csv)
        setMapping(guessMapping(csv.headers))
      } catch (err) {
        setError((err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  function setColumn(field: keyof ColumnMapping, column: string) {
    setMapping((prev) => (prev ? { ...prev, [field]: column || null } : prev))
  }

  async function handleImport() {
    if (!parsed || !mapping) return
    setImporting(true)
    setError(null)
    try {
      const res = await importLeads(parsed.rows, mapping, (done, total) => setProgress({ done, total }))
      setResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal title="Import leads from CSV" onClose={onClose}>
      <div className="form">
        {!parsed && (
          <>
            <p className="form-hint">
              Upload a CSV exported from Meta's Forms Library (or any CSV of leads). You'll confirm the
              column mapping before anything is imported.
            </p>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          </>
        )}

        {parsed && mapping && !result && (
          <>
            <p className="form-hint">
              {parsed.rows.length} rows found. Confirm which column maps to each field — auto-detected
              where possible.
            </p>
            {FIELDS.map(({ key, label, required }) => (
              <label key={key}>
                {label}
                {required && ' *'}
                <select value={mapping[key] ?? ''} onChange={(e) => setColumn(key, e.target.value)}>
                  <option value="">— none —</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <p className="form-hint">
              Anything not mapped is still preserved — the full raw row is saved in each lead's notes.
            </p>

            {progress && (
              <p className="form-hint">
                Importing… {progress.done} / {progress.total}
              </p>
            )}
            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" disabled={importing || !mapping.name} onClick={handleImport}>
                {importing ? 'Importing…' : `Import ${parsed.rows.length} leads`}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <p>
              Done — <strong>{result.inserted}</strong> imported, <strong>{result.skipped}</strong> already
              existed (skipped), <strong>{result.errors}</strong> failed.
            </p>
            <div className="form-actions">
              <button type="button" onClick={onDone}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
