import type { Coating } from './types'
import { todayISO, addDaysISO, addMonthsISO, daysBetween } from './dates'

export type CoatingStatus = {
  boosterLabel: string
  boosterLevel: 'ok' | 'due' | 'unknown'
  warrantyLabel: string
  warrantyLevel: 'ok' | 'expiring' | 'expired' | 'unknown'
}

export function getCoatingStatus(coating: Coating): CoatingStatus {
  const today = todayISO()

  const boosterBase = coating.last_booster_date ?? coating.applied_date
  let boosterLabel = 'No applied date on file'
  let boosterLevel: CoatingStatus['boosterLevel'] = 'unknown'
  if (boosterBase) {
    const nextDue = addDaysISO(boosterBase, coating.booster_interval_days)
    const diff = daysBetween(today, nextDue)
    if (diff < 0) {
      boosterLabel = `Booster overdue by ${-diff}d`
      boosterLevel = 'due'
    } else if (diff === 0) {
      boosterLabel = 'Booster due today'
      boosterLevel = 'due'
    } else {
      boosterLabel = `Booster due in ${diff}d`
      boosterLevel = 'ok'
    }
  }

  let warrantyLabel = 'No applied date on file'
  let warrantyLevel: CoatingStatus['warrantyLevel'] = 'unknown'
  if (coating.applied_date) {
    const end = addMonthsISO(coating.applied_date, coating.warranty_months)
    const diff = daysBetween(today, end)
    if (diff < 0) {
      warrantyLabel = `Warranty expired ${-diff}d ago`
      warrantyLevel = 'expired'
    } else if (diff <= 30) {
      warrantyLabel = `Warranty expires in ${diff}d`
      warrantyLevel = 'expiring'
    } else {
      warrantyLabel = `Warranty until ${end}`
      warrantyLevel = 'ok'
    }
  }

  return { boosterLabel, boosterLevel, warrantyLabel, warrantyLevel }
}
