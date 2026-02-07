import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, GripVertical, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StageConfig, StageTicket } from '@/types/phase'

const DRAG_TYPE_STAGE = 'application/x-stage-id'
const DRAG_TYPE_TICKET = 'application/x-ticket'
const TICKET_DATA_KEY = 'ticket-payload'

function getTicketPayload(ticketId: string, stageTempId: string): string {
  return JSON.stringify({ ticketId, stageTempId })
}

function parseTicketPayload(data: string): { ticketId: string; stageTempId: string } | null {
  try {
    return JSON.parse(data) as { ticketId: string; stageTempId: string }
  } catch {
    return null
  }
}

interface StageColumnProps {
  stage: StageConfig
  index: number
  stageCount: number
  onStageDragStart: (tempId: string) => void
  onStageDrop: (targetStageTempId: string) => void
  onTicketDrop: (targetStageTempId: string, ticketId: string, fromStageTempId: string, insertIndex?: number) => void
  onEditStage: (tempId: string) => void
  onRemoveStage: (tempId: string) => void
  onAddTicket: (stageTempId: string) => void
  onEditTicket: (stageTempId: string, ticket: StageTicket) => void
  onRemoveTicket: (stageTempId: string, ticketId: string) => void
  onReorderTickets: (stageTempId: string, fromIndex: number, toIndex: number) => void
  isStageDragging?: boolean
}

function StageColumn({
  stage,
  index,
  stageCount,
  onStageDragStart,
  onStageDrop,
  onTicketDrop,
  onEditStage,
  onRemoveStage,
  onAddTicket,
  onEditTicket,
  onRemoveTicket,
  onReorderTickets,
  isStageDragging,
}: StageColumnProps) {
  const tickets = stage.tickets ?? []
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null)
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null)

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.types[0]
    if (type === DRAG_TYPE_STAGE || type === DRAG_TYPE_TICKET) e.dataTransfer.dropEffect = 'move'
  }

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropInsertIndex(null)
    const stageId = e.dataTransfer.getData(DRAG_TYPE_STAGE)
    const ticketData = e.dataTransfer.getData(TICKET_DATA_KEY)
    if (stageId) {
      if (stageId !== stage.tempId) onStageDrop(stage.tempId)
      return
    }
    if (ticketData) {
      const p = parseTicketPayload(ticketData)
      if (p && p.stageTempId !== stage.tempId) onTicketDrop(stage.tempId, p.ticketId, p.stageTempId)
    }
  }

  const handleTicketDragStart = (e: React.DragEvent, ticket: StageTicket) => {
    setDraggingTicketId(ticket.id)
    e.dataTransfer.setData(DRAG_TYPE_TICKET, '1')
    e.dataTransfer.setData(TICKET_DATA_KEY, getTicketPayload(ticket.id, stage.tempId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTicketDragEnd = () => {
    setDraggingTicketId(null)
    setDropInsertIndex(null)
  }

  const handleTicketDragOver = (e: React.DragEvent, ticketIndex: number) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    setDropInsertIndex(e.clientY < mid ? ticketIndex : ticketIndex + 1)
  }

  const handleTicketDrop = (e: React.DragEvent, insertIndex: number) => {
    e.preventDefault()
    setDropInsertIndex(null)
    const ticketData = e.dataTransfer.getData(TICKET_DATA_KEY)
    if (!ticketData) return
    const p = parseTicketPayload(ticketData)
    if (!p) return
    if (p.stageTempId === stage.tempId) {
      const fromIndex = tickets.findIndex((t) => t.id === p.ticketId)
      if (fromIndex !== -1 && fromIndex !== insertIndex) onReorderTickets(stage.tempId, fromIndex, insertIndex)
    } else {
      onTicketDrop(stage.tempId, p.ticketId, p.stageTempId, insertIndex)
    }
  }

  return (
    <div
      className={`flex-shrink-0 w-[280px] flex flex-col rounded-xl border bg-card shadow-sm transition-shadow ${isStageDragging ? 'opacity-60 shadow-md' : ''}`}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
    >
      {/* Stage header - draggable */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_TYPE_STAGE, stage.tempId)
          e.dataTransfer.effectAllowed = 'move'
          onStageDragStart(stage.tempId)
        }}
        className="flex items-center gap-2 p-3 border-b bg-muted/40 rounded-t-xl cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{stage.phase_name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {stage.phase_type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {stage.planned_duration_days}d
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditStage(stage.tempId)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit stage
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRemoveStage(stage.tempId)}
              disabled={stageCount <= 1}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tickets */}
      <div className="flex-1 min-h-[120px] p-2 space-y-1 overflow-y-auto">
        {tickets.map((ticket, i) => (
          <div
            key={ticket.id}
            draggable
            onDragStart={(e) => handleTicketDragStart(e, ticket)}
            onDragEnd={handleTicketDragEnd}
            onDragOver={(e) => handleTicketDragOver(e, i)}
            onDrop={(e) => handleTicketDrop(e, dropInsertIndex ?? i)}
            className={`group rounded-lg border bg-background p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${draggingTicketId === ticket.id ? 'opacity-50' : ''} ${dropInsertIndex === i ? 'ring-1 ring-primary ring-inset' : ''}`}
          >
            <div className="font-medium text-sm">{ticket.title}</div>
            {ticket.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.description}</div>
            )}
            <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onEditTicket(stage.tempId, ticket)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onRemoveTicket(stage.tempId, ticket.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 h-20 flex items-center justify-center text-xs text-muted-foreground">
            Drop tickets here
          </div>
        )}
        {tickets.length > 0 && (
          <div
            className={`rounded-lg border-2 border-dashed my-1 transition-colors ${dropInsertIndex === tickets.length ? 'border-primary/40 h-8 bg-primary/5' : 'border-transparent h-2'}`}
            onDragOver={(e) => { e.preventDefault(); setDropInsertIndex(tickets.length) }}
            onDragLeave={() => setDropInsertIndex(null)}
            onDrop={(e) => {
              e.preventDefault()
              setDropInsertIndex(null)
              const ticketData = e.dataTransfer.getData(TICKET_DATA_KEY)
              if (!ticketData) return
              const p = parseTicketPayload(ticketData)
              if (!p) return
              if (p.stageTempId === stage.tempId) {
                const fromIndex = tickets.findIndex((t) => t.id === p.ticketId)
                if (fromIndex !== -1) onReorderTickets(stage.tempId, fromIndex, tickets.length)
              } else {
                onTicketDrop(stage.tempId, p.ticketId, p.stageTempId, tickets.length)
              }
            }}
          />
        )}
      </div>

      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddTicket(stage.tempId)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add ticket
        </Button>
      </div>
    </div>
  )
}

interface StageBoardProps {
  stages: StageConfig[]
  onChange: (stages: StageConfig[]) => void
  onEditStage: (tempId: string) => void
  onEditTicket?: (stageTempId: string, ticket: StageTicket) => void
}

export default function StageBoard({ stages, onChange, onEditStage, onEditTicket }: StageBoardProps) {
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null)

  const renumber = useCallback((list: StageConfig[]): StageConfig[] => {
    return list.map((s, i) => ({ ...s, phase_number: i + 1 }))
  }, [])

  const moveStage = useCallback(
    (fromTempId: string, toTempId: string) => {
      const fromIndex = stages.findIndex((s) => s.tempId === fromTempId)
      const toIndex = stages.findIndex((s) => s.tempId === toTempId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
      const next = [...stages]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      onChange(renumber(next))
    },
    [stages, onChange, renumber]
  )

  const removeStage = useCallback(
    (tempId: string) => {
      const removedNumber = stages.find((s) => s.tempId === tempId)?.phase_number
      const filtered = stages
        .filter((s) => s.tempId !== tempId)
        .map((s) => ({
          ...s,
          dependencies: (s.dependencies || []).filter((d) => d !== String(removedNumber)),
        }))
      onChange(renumber(filtered))
    },
    [stages, onChange, renumber]
  )

  const addTicket = useCallback(
    (stageTempId: string) => {
      const ticket: StageTicket = {
        id: crypto.randomUUID(),
        title: 'New ticket',
      }
      onChange(
        stages.map((s) =>
          s.tempId === stageTempId
            ? { ...s, tickets: [...(s.tickets || []), ticket] }
            : s
        )
      )
    },
    [stages, onChange]
  )

  const updateTicket = useCallback(
    (stageTempId: string, ticketId: string, updates: Partial<StageTicket>) => {
      onChange(
        stages.map((s) => {
          if (s.tempId !== stageTempId) return s
          const tickets = (s.tickets || []).map((t) =>
            t.id === ticketId ? { ...t, ...updates } : t
          )
          return { ...s, tickets }
        })
      )
    },
    [stages, onChange]
  )

  const removeTicket = useCallback(
    (stageTempId: string, ticketId: string) => {
      onChange(
        stages.map((s) =>
          s.tempId === stageTempId
            ? { ...s, tickets: (s.tickets || []).filter((t) => t.id !== ticketId) }
            : s
        )
      )
    },
    [stages, onChange]
  )

  const moveTicket = useCallback(
    (toStageTempId: string, ticketId: string, fromStageTempId: string, insertIndex?: number) => {
      const fromStage = stages.find((s) => s.tempId === fromStageTempId)
      const ticket = fromStage?.tickets?.find((t) => t.id === ticketId)
      if (!fromStage || !ticket) return

      const fromTickets = (fromStage.tickets || []).filter((t) => t.id !== ticketId)
      const toStage = stages.find((s) => s.tempId === toStageTempId)
      if (!toStage) return

      const toTickets = [...(toStage.tickets || [])]
      const idx = insertIndex ?? toTickets.length
      toTickets.splice(idx, 0, ticket)

      onChange(
        stages.map((s) => {
          if (s.tempId === fromStageTempId) return { ...s, tickets: fromTickets }
          if (s.tempId === toStageTempId) return { ...s, tickets: toTickets }
          return s
        })
      )
    },
    [stages, onChange]
  )

  const reorderTickets = useCallback(
    (stageTempId: string, fromIndex: number, toIndex: number) => {
      const stage = stages.find((s) => s.tempId === stageTempId)
      if (!stage || fromIndex === toIndex) return
      const tickets = [...(stage.tickets || [])]
      const [removed] = tickets.splice(fromIndex, 1)
      tickets.splice(toIndex, 0, removed)
      onChange(
        stages.map((s) => (s.tempId === stageTempId ? { ...s, tickets } : s))
      )
    },
    [stages, onChange]
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[320px]">
      {stages.map((stage) => (
        <StageColumn
          key={stage.tempId}
          stage={stage}
          index={stage.phase_number - 1}
          stageCount={stages.length}
          onStageDragStart={setDraggingStageId}
          onStageDrop={(targetTempId) => {
            if (draggingStageId) moveStage(draggingStageId, targetTempId)
            setDraggingStageId(null)
          }}
          onTicketDrop={moveTicket}
          onEditStage={onEditStage}
          onRemoveStage={removeStage}
          onAddTicket={addTicket}
          onEditTicket={onEditTicket ?? ((stageTempId, ticket) => updateTicket(stageTempId, ticket.id, { title: ticket.title, description: ticket.description }))}
          onRemoveTicket={removeTicket}
          onReorderTickets={reorderTickets}
          isStageDragging={draggingStageId === stage.tempId}
        />
      ))}
    </div>
  )
}
