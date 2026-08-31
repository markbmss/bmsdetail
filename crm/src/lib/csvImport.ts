import Papa from 'papaparse'
import { supabase } from './supabaseClient'
import { parseMetaCsvDate } from './dates'

export type ParsedCsv = {
  headers: string[]
  rows: Record<string, string>[]
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  const headers = result.meta.fields ?? []
  return { headers, rows: result.data }
}

export type ColumnMapping = {
  id: string | null // Meta's lead id column, used for dedup tagging
  createdTime: string | null // Meta's real lead-creation timestamp, not our insert time
  name: string | null
  phone: string | null
  city: string | null
  car: string | null
  serviceInterest: string | null
}

const CANDIDATES: Record<keyof ColumnMapping, string[]> = {
  id: ['id', 'lead_id', 'מזהה'],
  createdTime: ['created', 'created_time', 'created time', 'date created', 'תאריך יצירה'],
  name: ['full_name', 'name', 'שם מלא', 'שם'],
  phone: ['phone_number', 'phone', 'טלפון', 'מספר טלפון'],
  city: ['city', 'עיר'],
  car: ['car', 'vehicle', 'car_model', 'רכב', 'דגם רכב'],
  serviceInterest: ['service_interest', 'service', 'interested_in', 'שירות', 'סוג שירות'],
}

export function guessMapping(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
  const find = (candidates: string[]) => {
    for (const c of candidates) {
      const idx = lowerHeaders.indexOf(c.toLowerCase())
      if (idx !== -1) return headers[idx]
    }
    return null
  }
  return {
    id: find(CANDIDATES.id),
    createdTime: find(CANDIDATES.createdTime),
    name: find(CANDIDATES.name),
    phone: find(CANDIDATES.phone),
    city: find(CANDIDATES.city),
    car: find(CANDIDATES.car),
    serviceInterest: find(CANDIDATES.serviceInterest),
  }
}

export type ImportResult = { inserted: number; skipped: number; errors: number }

export async function importLeads(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  let inserted = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const leadId = mapping.id ? row[mapping.id] : null
    const tag = leadId ? `Meta lead ${leadId}.` : null

    try {
      if (tag) {
        const { data: existing, error: selectError } = await supabase
          .from('leads')
          .select('id')
          .ilike('notes', `${tag}%`)
          .limit(1)
        if (selectError) throw selectError
        if (existing && existing.length > 0) {
          skipped++
          onProgress?.(i + 1, rows.length)
          continue
        }
      }

      const name = mapping.name ? row[mapping.name] : null
      const phone = mapping.phone ? row[mapping.phone] : null
      const city = mapping.city ? row[mapping.city] : null
      const car = mapping.car ? row[mapping.car] : null
      const serviceInterest = mapping.serviceInterest ? row[mapping.serviceInterest] : null
      const createdAt = mapping.createdTime ? parseMetaCsvDate(row[mapping.createdTime] ?? '') : null

      const { error: insertError } = await supabase.from('leads').insert({
        name: name || null,
        phone: phone || null,
        city: city || null,
        car: car || null,
        service_interest: serviceInterest || null,
        source: 'meta',
        status: 'new',
        // Use Meta's real creation time when we have it, so "time joined" in
        // the UI reflects when the lead actually came in, not when we
        // happened to run this import.
        ...(createdAt ? { created_at: createdAt } : {}),
        notes: tag ? `${tag} Raw row: ${JSON.stringify(row)}` : `Imported from CSV. Raw row: ${JSON.stringify(row)}`,
      })
      if (insertError) throw insertError
      inserted++
    } catch (err) {
      console.error('Row import failed:', err, row)
      errors++
    }

    onProgress?.(i + 1, rows.length)
  }

  return { inserted, skipped, errors }
}
