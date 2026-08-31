import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { Lead, LeadStatus } from '../lib/types'
import { waLink, callLink, relativeTime } from '../lib/dates'
import { isFollowupDue } from '../lib/leads'

const COLUMNS: LeadStatus[] = ['new', 'contacted', 'quoted', 'booked', 'done', 'lost']

export default function LeadsBoard({
  leads,
  onStatusChange,
  onOpenLead,
  onConvert,
}: {
  leads: Lead[]
  onStatusChange: (id: string, status: LeadStatus) => void
  onOpenLead: (lead: Lead) => void
  onConvert: (lead: Lead) => void
}) {
  // Without a distance constraint, dnd-kit treats any pointer movement (even
  // a click's natural 1-2px jitter) as a drag, which swallows onClick on the
  // card. Requiring 8px of movement before a drag activates lets plain
  // clicks (open lead) and real drags (change status) coexist.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as LeadStatus
    const lead = leads.find((l) => l.id === active.id)
    if (lead && lead.status !== newStatus) {
      onStatusChange(lead.id, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="board">
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            leads={leads.filter((l) => l.status === status)}
            onOpenLead={onOpenLead}
            onConvert={onConvert}
          />
        ))}
      </div>
    </DndContext>
  )
}

function BoardColumn({
  status,
  leads,
  onOpenLead,
  onConvert,
}: {
  status: LeadStatus
  leads: Lead[]
  onOpenLead: (lead: Lead) => void
  onConvert: (lead: Lead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={isOver ? 'board-column board-column-over' : 'board-column'}>
      <div className="board-column-header">
        <span className={`status-badge status-${status}`}>{status}</span>
        <span className="board-column-count">{leads.length}</span>
      </div>
      <div className="board-column-cards">
        {leads.map((lead) => (
          <BoardCard key={lead.id} lead={lead} onOpen={onOpenLead} onConvert={onConvert} />
        ))}
      </div>
    </div>
  )
}

function BoardCard({
  lead,
  onOpen,
  onConvert,
}: {
  lead: Lead
  onOpen: (lead: Lead) => void
  onConvert: (lead: Lead) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const wa = waLink(lead.phone)
  const call = callLink(lead.phone)
  const canConvert = !lead.customer_id && lead.status !== 'lost'
  const followupDue = isFollowupDue(lead)

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'board-card board-card-dragging' : 'board-card'}
      {...listeners}
      {...attributes}
    >
      <div className="board-card-main" onClick={() => onOpen(lead)}>
        <span className="board-card-name">
          {followupDue && <span className="urgency-dot" title="Follow-up due" />}
          {lead.name ?? 'Unnamed lead'}
        </span>
        <span className="board-card-meta">
          {[lead.city, lead.service_interest].filter(Boolean).join(' · ')}
        </span>
        <span className="board-card-source">
          {[lead.source, relativeTime(lead.created_at)].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className="board-card-actions">
        {call && (
          <a
            className="reminder-row-call"
            href={call}
            onClick={(e) => e.stopPropagation()}
            title="Call"
          >
            Call
          </a>
        )}
        {wa && (
          <a
            className="reminder-row-wa"
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            WhatsApp
          </a>
        )}
        {lead.customer_id && <span className="converted-badge">converted</span>}
        {canConvert && (
          <button
            className="btn-secondary board-card-convert"
            onClick={(e) => {
              e.stopPropagation()
              onConvert(lead)
            }}
          >
            Convert
          </button>
        )}
      </div>
    </div>
  )
}
