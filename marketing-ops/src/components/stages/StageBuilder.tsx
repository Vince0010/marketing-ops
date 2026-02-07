import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw } from 'lucide-react'
import type { StageConfig } from '@/types/phase'
import { createDefaultStages } from '@/lib/defaultStages'
import StageList from './StageList'
import StageEditor from './StageEditor'

interface Props {
  stages: StageConfig[]
  onChange: (stages: StageConfig[]) => void
}

export default function StageBuilder({ stages, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingStage = editingId ? stages.find((s) => s.tempId === editingId) || null : null

  const renumber = (list: StageConfig[]): StageConfig[] =>
    list.map((s, i) => ({ ...s, phase_number: i + 1 }))

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
    }
    onChange([...stages, newStage])
    setEditingId(newStage.tempId)
  }

  const removeStage = (tempId: string) => {
    const removedNumber = stages.find((s) => s.tempId === tempId)?.phase_number
    const filtered = stages
      .filter((s) => s.tempId !== tempId)
      .map((s) => ({
        ...s,
        dependencies: s.dependencies.filter((d) => d !== String(removedNumber)),
      }))
    onChange(renumber(filtered))
  }

  const moveStage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= stages.length) return
    const updated = [...stages]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange(renumber(updated))
  }

  const updateStage = (updated: StageConfig) => {
    onChange(stages.map((s) => (s.tempId === updated.tempId ? updated : s)))
  }

  const resetStages = () => {
    onChange(createDefaultStages())
  }

  const totalDays = stages.reduce((sum, s) => sum + s.planned_duration_days, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {stages.length} stage{stages.length !== 1 ? 's' : ''} · {totalDays} total days
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetStages}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Stage
          </Button>
        </div>
      </div>

      <StageList
        stages={stages}
        onMove={moveStage}
        onEdit={setEditingId}
        onRemove={removeStage}
      />

      <StageEditor
        stage={editingStage}
        allStages={stages}
        open={!!editingId}
        onSave={updateStage}
        onClose={() => setEditingId(null)}
      />
    </div>
  )
}
