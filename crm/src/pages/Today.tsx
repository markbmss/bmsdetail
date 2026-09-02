import { useEffect, useState } from 'react'
import {
  fetchFollowupsDue,
  fetchBoosterDue,
  fetchWarrantyExpiring,
  fetchB2BRenewalsSoon,
  fetchNewLeadsCount,
  type FollowupItem,
  type BoosterDueItem,
  type WarrantyExpiringItem,
} from '../lib/reminders'
import type { B2BAccount } from '../lib/types'
import { waLink, callLink } from '../lib/dates'

type State = {
  loading: boolean
  error: string | null
  followups: FollowupItem[]
  boosterDue: BoosterDueItem[]
  warrantyExpiring: WarrantyExpiringItem[]
  b2bRenewals: B2BAccount[]
  newLeadsCount: number
}

const initialState: State = {
  loading: true,
  error: null,
  followups: [],
  boosterDue: [],
  warrantyExpiring: [],
  b2bRenewals: [],
  newLeadsCount: 0,
}

export default function Today() {
  const [state, setState] = useState<State>(initialState)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [followups, boosterDue, warrantyExpiring, b2bRenewals, newLeadsCount] =
          await Promise.all([
            fetchFollowupsDue(),
            fetchBoosterDue(),
            fetchWarrantyExpiring(),
            fetchB2BRenewalsSoon(),
            fetchNewLeadsCount(),
          ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          followups,
          boosterDue,
          warrantyExpiring,
          b2bRenewals,
          newLeadsCount,
        })
      } catch (err) {
        if (cancelled) return
        setState((s) => ({ ...s, loading: false, error: (err as Error).message }))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.loading) return <p className="today-status">טוען תזכורות…</p>
  if (state.error) return <p className="today-status today-error">שגיאה: {state.error}</p>

  return (
    <div className="today">
      <div className="today-kpi">
        <span className="today-kpi-value">{state.newLeadsCount}</span>
        <span className="today-kpi-label">לידים חדשים</span>
      </div>

      <ReminderSection title="מעקבים לביצוע" count={state.followups.length}>
        {state.followups.map((item) =>
          item.kind === 'lead' ? (
            <FollowupLeadRow key={`lead-${item.lead.id}`} item={item} />
          ) : (
            <FollowupTaskRow key={`task-${item.task.id}`} item={item} />
          ),
        )}
      </ReminderSection>

      <ReminderSection title="בוסטר קרמי לביצוע" count={state.boosterDue.length}>
        {state.boosterDue.map(({ coating, nextBoosterDate }) => {
          const customer = coating.car?.customer
          return (
            <Row
              key={coating.id}
              primary={customer?.name ?? 'לקוח לא ידוע'}
              secondary={[coating.car?.make_model, coating.product].filter(Boolean).join(' · ')}
              due={`עד ${nextBoosterDate}`}
              phone={customer?.phone}
            />
          )
        })}
      </ReminderSection>

      <ReminderSection title="אחריות פגה בקרוב (30 יום)" count={state.warrantyExpiring.length}>
        {state.warrantyExpiring.map(({ coating, warrantyEndDate }) => {
          const customer = coating.car?.customer
          return (
            <Row
              key={coating.id}
              primary={customer?.name ?? 'לקוח לא ידוע'}
              secondary={[coating.car?.make_model, coating.product].filter(Boolean).join(' · ')}
              due={`פג ב-${warrantyEndDate}`}
              phone={customer?.phone}
            />
          )
        })}
      </ReminderSection>

      <ReminderSection title="חידוש B2B בקרוב" count={state.b2bRenewals.length}>
        {state.b2bRenewals.map((account) => (
          <Row
            key={account.id}
            primary={account.name ?? 'חשבון ללא שם'}
            secondary={account.contact_name ?? ''}
            due={`מתחדש ב-${account.renewal_date}`}
            phone={account.phone}
          />
        ))}
      </ReminderSection>
    </div>
  )
}

function ReminderSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="reminder-section">
      <h2>
        {title} <span className="reminder-count">{count}</span>
      </h2>
      {count === 0 ? <p className="reminder-empty">אין כאן כלום — הכל מעודכן.</p> : <ul>{children}</ul>}
    </section>
  )
}

function Row({
  primary,
  secondary,
  due,
  phone,
}: {
  primary: string
  secondary: string
  due: string
  phone?: string | null
}) {
  const wa = waLink(phone)
  const call = callLink(phone)
  return (
    <li className="reminder-row">
      <div className="reminder-row-main">
        <span className="reminder-row-primary">{primary}</span>
        {secondary && <span className="reminder-row-secondary">{secondary}</span>}
      </div>
      <span className="reminder-row-due">{due}</span>
      {call && (
        <a className="reminder-row-call" href={call} title="התקשר">
          התקשר
        </a>
      )}
      {wa && (
        <a className="reminder-row-wa" href={wa} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      )}
    </li>
  )
}

function FollowupLeadRow({ item }: { item: Extract<FollowupItem, { kind: 'lead' }> }) {
  const { lead } = item
  const secondary = [lead.city, lead.service_interest].filter(Boolean).join(' · ')
  return (
    <Row
      primary={lead.name ?? 'ליד ללא שם'}
      secondary={secondary}
      due={`עד ${lead.next_followup ?? ''}${lead.source ? ` · ${lead.source}` : ''}`}
      phone={lead.phone}
    />
  )
}

function FollowupTaskRow({ item }: { item: Extract<FollowupItem, { kind: 'task' }> }) {
  const { task } = item
  return (
    <Row
      primary={task.title ?? 'משימה ללא כותרת'}
      secondary={task.notes ?? ''}
      due={`עד ${task.due_date ?? ''}`}
    />
  )
}
