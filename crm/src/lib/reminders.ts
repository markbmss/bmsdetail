import { supabase } from './supabaseClient'
import { todayISO, addDaysISO, addMonthsISO } from './dates'
import type { Lead, Task, B2BAccount, CoatingWithCar } from './types'

export type FollowupItem =
  | { kind: 'lead'; due: string | null; lead: Lead }
  | { kind: 'task'; due: string | null; task: Task }

export type BoosterDueItem = { coating: CoatingWithCar; nextBoosterDate: string }
export type WarrantyExpiringItem = { coating: CoatingWithCar; warrantyEndDate: string }

// leads.next_followup <= today (status not done/lost) + tasks.due_date <= today (not done)
export async function fetchFollowupsDue(): Promise<FollowupItem[]> {
  const today = todayISO()

  const [leadsRes, tasksRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .lte('next_followup', today)
      .not('status', 'in', '(done,lost)')
      .order('next_followup', { ascending: true }),
    supabase
      .from('tasks')
      .select('*')
      .lte('due_date', today)
      .eq('done', false)
      .order('due_date', { ascending: true }),
  ])

  if (leadsRes.error) throw leadsRes.error
  if (tasksRes.error) throw tasksRes.error

  const leadItems: FollowupItem[] = (leadsRes.data as Lead[]).map((lead) => ({
    kind: 'lead',
    due: lead.next_followup,
    lead,
  }))
  const taskItems: FollowupItem[] = (tasksRes.data as Task[]).map((task) => ({
    kind: 'task',
    due: task.due_date,
    task,
  }))

  return [...leadItems, ...taskItems].sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
}

// coatings where coalesce(last_booster_date, applied_date) + booster_interval_days <= today
export async function fetchBoosterDue(): Promise<BoosterDueItem[]> {
  const today = todayISO()
  const { data, error } = await supabase
    .from('coatings')
    .select('*, car:cars(*, customer:customers(*))')
  if (error) throw error

  const items: BoosterDueItem[] = []
  for (const coating of data as CoatingWithCar[]) {
    const base = coating.last_booster_date ?? coating.applied_date
    if (!base) continue
    const nextBoosterDate = addDaysISO(base, coating.booster_interval_days)
    if (nextBoosterDate <= today) items.push({ coating, nextBoosterDate })
  }
  return items.sort((a, b) => a.nextBoosterDate.localeCompare(b.nextBoosterDate))
}

// coatings where applied_date + warranty_months is within the next 30 days
export async function fetchWarrantyExpiring(): Promise<WarrantyExpiringItem[]> {
  const today = todayISO()
  const horizon = addDaysISO(today, 30)
  const { data, error } = await supabase
    .from('coatings')
    .select('*, car:cars(*, customer:customers(*))')
  if (error) throw error

  const items: WarrantyExpiringItem[] = []
  for (const coating of data as CoatingWithCar[]) {
    if (!coating.applied_date) continue
    const warrantyEndDate = addMonthsISO(coating.applied_date, coating.warranty_months)
    if (warrantyEndDate >= today && warrantyEndDate <= horizon) {
      items.push({ coating, warrantyEndDate })
    }
  }
  return items.sort((a, b) => a.warrantyEndDate.localeCompare(b.warrantyEndDate))
}

// b2b_accounts where renewal_date is within the next 30 days
export async function fetchB2BRenewalsSoon(): Promise<B2BAccount[]> {
  const today = todayISO()
  const horizon = addDaysISO(today, 30)
  const { data, error } = await supabase
    .from('b2b_accounts')
    .select('*')
    .gte('renewal_date', today)
    .lte('renewal_date', horizon)
    .order('renewal_date', { ascending: true })
  if (error) throw error
  return data as B2BAccount[]
}

export async function fetchNewLeadsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
  if (error) throw error
  return count ?? 0
}
