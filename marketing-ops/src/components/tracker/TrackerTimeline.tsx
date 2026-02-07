import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical, Play, CheckCircle2, ArrowUp, ArrowDown, Plus, Trash2, Pencil, RotateCcw } from 'lucide-react'
import TrackerTicketEditPopover from './TrackerTicketEditPopover'
import type { ExecutionPhase, PhaseTicket } from '@/types/phase'

const DRAG_TYPE_PHASE = 'application/x-phase-id'
const DRAG_TYPE_TICKET = 'application/x-tracker-ticket'
const TICKET_PAYLOAD_KEY = 'tracker-ticket-payload'

function getTicketPayload(ticketId: string, phaseId: string) {
  return JSON.stringify({ ticketId, phaseId })
}
function parseTicketPayload(data: string): { ticketId: string; phaseId: string } | null {
  try {
    return JSON.parse(data) as { ticketId: string; phaseId: string }
  } catch {
    return null
  }
}

interface TrackerTimelineProps {
  phases: ExecutionPhase[]
  onReorder?: (reordered: ExecutionPhase[]) => void
  onStartPhase?: (phaseId: string) => void
  onCompletePhase?: (phaseId: string) => void
  onAddTicket?: (phaseId: string) => void
  onMoveTicket?: (ticketId: string, fromPhaseId: string, toPhaseId: string, insertIndex?: number) => void
  onRemoveTicket?: (phaseId: string, ticketId: string) => void
  onEditTicket?: (phaseId: string, ticketId: string, updates: Partial<PhaseTicket>) => void
  onRevertPhase?: (phaseId: string, newStatus: 'pending' | 'in_progress') => void
  getPhaseStatusColor: (status: string) => string
  getPhaseStatusBadge: (status: string) => React.ReactNode
}

export default function TrackerTimeline({
  phases,
  onReorder,
  onStartPhase,
  onCompletePhase,
  onAddTicket,
  onMoveTicket,
  onRemoveTicket,
  onEditTicket,
  onRevertPhase,
  getPhaseStatusColor,
  getPhaseStatusBadge,
}: TrackerTimelineProps) {
  const [draggingPhaseId, setDraggingPhaseId] = useState<string | null>(null)
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null)
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null)

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes(DRAG_TYPE_PHASE) || e.dataTransfer.types.includes(DRAG_TYPE_TICKET)) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleColumnDrop = (e: React.DragEvent, targetPhaseId: string) => {
    e.preventDefault()
    setDropInsertIndex(null)
    const phaseId = e.dataTransfer.getData(DRAG_TYPE_PHASE)
    const ticketData = e.dataTransfer.getData(TICKET_PAYLOAD_KEY)
    if (phaseId && phaseId !== targetPhaseId && onReorder) {
      const fromIndex = phases.findIndex((p) => p.id === phaseId)
      const toIndex = phases.findIndex((p) => p.id === targetPhaseId)
      if (fromIndex !== -1 && toIndex !== -1) {
        const next = [...phases]
        const [removed] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, removed)
        onReorder(next.map((p, i) => ({ ...p, phase_number: i + 1 })))
      }
      setDraggingPhaseId(null)
      return
    }
    if (ticketData && onMoveTicket) {
      const p = parseTicketPayload(ticketData)
      if (p && p.phaseId !== targetPhaseId) {
        onMoveTicket(p.ticketId, p.phaseId, targetPhaseId)
      }
    }
    setDraggingTicketId(null)
  }

  const phaseTickets = (p: ExecutionPhase): PhaseTicket[] => p.tickets ?? []
  const legacyItems = (p: ExecutionPhase) => [
    ...(p.activities ?? []).map((title) => ({ id: `act-${title}`, title, type: 'activity' as const })),
    ...(p.deliverables ?? []).map((title) => ({ id: `del-${title}`, title, type: 'deliverable' as const })),
  ]

  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No execution phases defined. Create phases in the campaign setup.
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[320px]">
      {phases.map((phase) => {
        const tickets = phaseTickets(phase)
        const legacy = legacyItems(phase)
        const isDraggingPhase = draggingPhaseId === phase.id

        return (
          <div
            key={phase.id}
            className="flex-shrink-0 w-[280px] flex flex-col rounded-xl border bg-card shadow-sm transition-shadow"
            onDragOver={handleColumnDragOver}
            onDrop={(e) => handleColumnDrop(e, phase.id)}
          >
            {/* Phase header - draggable */}
            <div
              draggable={!!onReorder}
              onDragStart={(e) => {
                if (onReorder) {
                  setDraggingPhaseId(phase.id)
                  e.dataTransfer.setData(DRAG_TYPE_PHASE, phase.id)
                  e.dataTransfer.effectAllowed = 'move'
                }
              }}
              onDragEnd={() => setDraggingPhaseId(null)}
              className={`flex items-center gap-2 p-3 border-b rounded-t-xl ${onReorder ? 'cursor-grab active:cursor-grabbing bg-muted/40' : ''} ${isDraggingPhase ? 'opacity-60' : ''}`}
            >
              {onReorder && <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{phase.phase_name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {phase.phase_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {phase.planned_duration_days}d
                    {phase.actual_duration_days != null && ` / ${phase.actual_duration_days}d actual`}
                  </span>
                </div>
              </div>
              {getPhaseStatusBadge(phase.status)}
            </div>

            {/* Tickets + legacy activities/deliverables */}
            <div className="flex-1 min-h-[100px] p-2 space-y-1 overflow-y-auto">
              {tickets.map((ticket, i) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  phaseId={phase.id}
                  phaseTickets={tickets}
                  dropInsertIndex={dropInsertIndex}
                  setDropInsertIndex={setDropInsertIndex}
                  draggingTicketId={draggingTicketId}
                  setDraggingTicketId={setDraggingTicketId}
                  onMoveTicket={onMoveTicket}
                  onRemoveTicket={onRemoveTicket}
                  onEditTicket={onEditTicket}
                  index={i}
                />
              ))}
              {legacy.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-muted/30 px-2.5 py-2 text-sm"
                >
                  <span className="text-muted-foreground text-xs uppercase">{item.type}</span>
                  <div className="font-medium truncate">{item.title}</div>
                </div>
              ))}
              {phase.status === 'completed' && phase.drift_days !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1.5 ${phase.drift_days > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}
                >
                  {phase.drift_days > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(phase.drift_days)}d {phase.drift_days > 0 ? 'over' : 'under'}
                </div>
              )}
            </div>

            {/* Add ticket + Start/Complete / Revert */}
            <div className="p-2 border-t space-y-1">
              {onAddTicket && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTicket(phase.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add ticket
                </Button>
              )}
              {phase.status === 'pending' && onStartPhase && (
                <Button size="sm" className="w-full gap-1" onClick={() => onStartPhase(phase.id)}>
                  <Play className="w-3 h-3" />
                  Start Phase
                </Button>
              )}
              {phase.status === 'in_progress' && onCompletePhase && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => onCompletePhase(phase.id)}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </Button>
              )}
              {phase.status === 'completed' && onRevertPhase && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => onRevertPhase(phase.id, 'in_progress')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Revert to In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 gap-1 text-xs text-muted-foreground"
                    onClick={() => onRevertPhase(phase.id, 'pending')}
                  >
                    Revert to Pending
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Low', medium: 'Med', high: 'High', critical: 'Crit' }

interface TicketCardProps {
  ticket: PhaseTicket
  phaseId: string
  phaseTickets: PhaseTicket[]
  dropInsertIndex: number | null
  setDropInsertIndex: (n: number | null) => void
  draggingTicketId: string | null
  setDraggingTicketId: (id: string | null) => void
  onMoveTicket?: (ticketId: string, fromPhaseId: string, toPhaseId: string, insertIndex?: number) => void
  onRemoveTicket?: (phaseId: string, ticketId: string) => void
  onEditTicket?: (phaseId: string, ticketId: string, updates: Partial<PhaseTicket>) => void
  index: number
}

function TicketCard({
  ticket,
  phaseId,
  phaseTickets,
  dropInsertIndex,
  setDropInsertIndex,
  draggingTicketId,
  setDraggingTicketId,
  onMoveTicket,
  onRemoveTicket,
  onEditTicket,
  index,
}: TicketCardProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropInsertIndex(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropInsertIndex(null)
    const data = e.dataTransfer.getData(TICKET_PAYLOAD_KEY)
    if (!data || !onMoveTicket) return
    const p = parseTicketPayload(data)
    if (!p) return
    if (p.phaseId === phaseId) {
      const fromIndex = phaseTickets.findIndex((t) => t.id === p.ticketId)
      if (fromIndex !== -1 && fromIndex !== index && fromIndex !== index + 1) {
        onMoveTicket(p.ticketId, p.phaseId, phaseId, index)
      }
    } else {
      onMoveTicket(p.ticketId, p.phaseId, phaseId, index)
    }
    setDraggingTicketId(null)
  }

  const card = (
    <div
      draggable
      onDragStart={(e) => {
        setDraggingTicketId(ticket.id)
        e.dataTransfer.setData(DRAG_TYPE_TICKET, '1')
        e.dataTransfer.setData(TICKET_PAYLOAD_KEY, getTicketPayload(ticket.id, phaseId))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => { setDraggingTicketId(null); setDropInsertIndex(null) }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group rounded-lg border bg-background p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${draggingTicketId === ticket.id ? 'opacity-50' : ''} ${dropInsertIndex === index ? 'ring-1 ring-primary ring-inset' : ''}`}
    >
      <div className="font-medium text-sm">{ticket.title}</div>
      {ticket.description && (
        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ticket.description}</div>
      )}
      {(ticket.assignee || ticket.due_date || ticket.priority) && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {ticket.assignee && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{ticket.assignee}</span>
          )}
          {ticket.due_date && (
            <span className="text-[10px] text-muted-foreground">{ticket.due_date}</span>
          )}
          {ticket.priority && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-muted'
            }`}>
              {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
          )}
        </div>
      )}
      {(onEditTicket || onRemoveTicket) && (
        <div className="flex justify-end gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEditTicket && (
            <TrackerTicketEditPopover
              ticket={ticket}
              phaseId={phaseId}
              onSave={onEditTicket}
            >
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                <Pencil className="h-3 w-3" />
              </Button>
            </TrackerTicketEditPopover>
          )}
          {onRemoveTicket && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemoveTicket(phaseId, ticket.id) }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )

  return card
}
