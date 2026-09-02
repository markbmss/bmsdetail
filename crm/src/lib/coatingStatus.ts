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
  let boosterLabel = 'אין תאריך יישום רשום'
  let boosterLevel: CoatingStatus['boosterLevel'] = 'unknown'
  if (boosterBase) {
    const nextDue = addDaysISO(boosterBase, coating.booster_interval_days)
    const diff = daysBetween(today, nextDue)
    if (diff < 0) {
      boosterLabel = `בוסטר באיחור של ${-diff} ימים`
      boosterLevel = 'due'
    } else if (diff === 0) {
      boosterLabel = 'בוסטר לביצוע היום'
      boosterLevel = 'due'
    } else {
      boosterLabel = `בוסטר בעוד ${diff} ימים`
      boosterLevel = 'ok'
    }
  }

  let warrantyLabel = 'אין תאריך יישום רשום'
  let warrantyLevel: CoatingStatus['warrantyLevel'] = 'unknown'
  if (coating.applied_date) {
    const end = addMonthsISO(coating.applied_date, coating.warranty_months)
    const diff = daysBetween(today, end)
    if (diff < 0) {
      warrantyLabel = `האחריות פגה לפני ${-diff} ימים`
      warrantyLevel = 'expired'
    } else if (diff <= 30) {
      warrantyLabel = `האחריות פגה בעוד ${diff} ימים`
      warrantyLevel = 'expiring'
    } else {
      warrantyLabel = `אחריות עד ${end}`
      warrantyLevel = 'ok'
    }
  }

  return { boosterLabel, boosterLevel, warrantyLabel, warrantyLevel }
}
