import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw } from 'lucide-react'
import type { StageConfig, StageTicket } from '@/types/phase'
import { createDefaultStages } from '@/lib/defaultStages'
import StageBoard from './StageBoard'
import StageEditor from './StageEditor'
import TicketEditor from './TicketEditor'

interface Props {
  stages: StageConfig[]
  onChange: (stages: StageConfig[]) => void
}

export default function StageBuilder({ stages, onChange }: Props) {
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingTicket, setEditingTicket] = useState<{ stageTempId: string; ticket: StageTicket } | null>(null)

  const editingStage = editingStageId ? stages.find((s) => s.tempId === editingStageId) ?? null : null

  const addStage = () => {
    const newStage: StageConfig = {
      tempId: crypto.randomUUID(),
      phase_number: stages.length + 1,
      phase_name: 'New Stage',
      phase_type: 'planning',
      planned_duration_days: 3,
      owner: '',
      activities: [],
      deliverables: [],
      approvers: [],
      dependencies: [],
      tickets: [],
    }
    onChange([...stages, newStage])
    setEditingStageId(newStage.tempId)
  }

  const updateStage = (updated: StageConfig) => {
    onChange(stages.map((s) => (s.tempId === updated.tempId ? updated : s)))
  }

  const updateTicketFromEditor = (updates: { title: string; description?: string }) => {
    if (!editingTicket) return
    const { stageTempId, ticket } = editingTicket
    onChange(
      stages.map((s) => {
        if (s.tempId !== stageTempId) return s
        const tickets = (s.tickets ?? []).map((t) =>
          t.id === ticket.id ? { ...t, ...updates } : t
        )
        return { ...s, tickets }
      })
    )
    setEditingTicket(null)
  }

  const totalDays = stages.reduce((sum, s) => sum + s.planned_duration_days, 0)
  const totalTickets = stages.reduce((sum, s) => sum + (s.tickets?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {stages.length} stage{stages.length !== 1 ? 's' : ''} · {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} · {totalDays} total days
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onChange(createDefaultStages())}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add stage
          </Button>
        </div>
      </div>

      <StageBoard
        stages={stages}
        onChange={onChange}
        onEditStage={setEditingStageId}
        onEditTicket={(stageTempId, ticket) => setEditingTicket({ stageTempId, ticket })}
      />

      <StageEditor
        stage={editingStage}
        allStages={stages}
        open={!!editingStageId}
        onSave={updateStage}
        onClose={() => setEditingStageId(null)}
      />

      <TicketEditor
        ticket={editingTicket?.ticket ?? null}
        open={!!editingTicket}
        onSave={updateTicketFromEditor}
        onClose={() => setEditingTicket(null)}
      />
    </div>
  )
}
