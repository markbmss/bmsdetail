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
  { key: 'id', label: 'מזהה ליד ב-Meta (למניעת כפילויות בייבוא חוזר)', required: false },
  { key: 'createdTime', label: 'זמן יצירה (לדיוק ב"זמן הצטרפות")', required: false },
  { key: 'name', label: 'שם', required: true },
  { key: 'phone', label: 'טלפון', required: false },
  { key: 'city', label: 'עיר', required: false },
  { key: 'car', label: 'רכב', required: false },
  { key: 'serviceInterest', label: 'תחום עניין', required: false },
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
          setError('לא נמצאו שורות בקובץ ה-CSV.')
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
    <Modal title="ייבוא לידים מקובץ CSV" onClose={onClose}>
      <div className="form">
        {!parsed && (
          <>
            <p className="form-hint">
              העלה קובץ CSV שיוצא מ-Forms Library של Meta (או כל קובץ CSV של לידים). תוכל לאשר את
              התאמת העמודות לפני הייבוא בפועל.
            </p>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          </>
        )}

        {parsed && mapping && !result && (
          <>
            <p className="form-hint">
              נמצאו {parsed.rows.length} שורות. אשר איזו עמודה מתאימה לכל שדה — זוהה אוטומטית היכן שניתן.
            </p>
            {FIELDS.map(({ key, label, required }) => (
              <label key={key}>
                {label}
                {required && ' *'}
                <select value={mapping[key] ?? ''} onChange={(e) => setColumn(key, e.target.value)}>
                  <option value="">— ללא —</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <p className="form-hint">
              כל מה שלא ימופה עדיין נשמר — השורה הגולמית המלאה נשמרת בהערות של כל ליד.
            </p>

            {progress && (
              <p className="form-hint">
                מייבא… {progress.done} / {progress.total}
              </p>
            )}
            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                ביטול
              </button>
              <button type="button" disabled={importing || !mapping.name} onClick={handleImport}>
                {importing ? 'מייבא…' : `ייבוא ${parsed.rows.length} לידים`}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <p>
              הושלם — <strong>{result.inserted}</strong> יובאו, <strong>{result.skipped}</strong> כבר
              קיימים (דולגו), <strong>{result.errors}</strong> נכשלו.
            </p>
            <div className="form-actions">
              <button type="button" onClick={onDone}>
                סגירה
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
