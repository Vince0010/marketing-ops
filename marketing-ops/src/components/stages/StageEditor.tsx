import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DEFAULT_PHASE_TYPES } from '@/types/phase'
import type { StageConfig } from '@/types/phase'

interface Props {
  stage: StageConfig | null
  allStages: StageConfig[]
  open: boolean
  onSave: (updated: StageConfig) => void
  onClose: () => void
}

export default function StageEditor({ stage, allStages, open, onSave, onClose }: Props) {
  const [local, setLocal] = useState<StageConfig | null>(null)
  const [useCustomType, setUseCustomType] = useState(false)

  useEffect(() => {
    if (stage) {
      setLocal({ ...stage })
      setUseCustomType(!DEFAULT_PHASE_TYPES.includes(stage.phase_type as any))
    }
  }, [stage])

  if (!local) return null

  const otherStages = allStages.filter((s) => s.tempId !== local.tempId)

  const toggleDependency = (phaseNumber: string) => {
    const deps = local.dependencies
    const updated = deps.includes(phaseNumber)
      ? deps.filter((d) => d !== phaseNumber)
      : [...deps, phaseNumber]
    setLocal({ ...local, dependencies: updated })
  }

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
          <DialogDescription>Configure the details for this execution stage.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="stage-name">Stage Name *</Label>
            <Input
              id="stage-name"
              value={local.phase_name}
              onChange={(e) => setLocal({ ...local, phase_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Stage Type</Label>
            {useCustomType ? (
              <div className="flex gap-2">
                <Input
                  value={local.phase_type}
                  onChange={(e) => setLocal({ ...local, phase_type: e.target.value })}
                  placeholder="Custom type name"
                />
                <Button variant="outline" size="sm" onClick={() => setUseCustomType(false)}>
                  Preset
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={local.phase_type}
                  onValueChange={(v) => setLocal({ ...local, phase_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_PHASE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setUseCustomType(true)}>
                  Custom
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage-duration">Duration (days) *</Label>
              <Input
                id="stage-duration"
                type="number"
                min={1}
                value={local.planned_duration_days}
                onChange={(e) => setLocal({ ...local, planned_duration_days: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-owner">Owner / Assignee</Label>
              <Input
                id="stage-owner"
                placeholder="e.g. John Smith"
                value={local.owner}
                onChange={(e) => setLocal({ ...local, owner: e.target.value })}
              />
            </div>
          </div>

          {otherStages.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencies (must complete before this stage)</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {otherStages.map((s) => (
                  <label key={s.tempId} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={local.dependencies.includes(String(s.phase_number))}
                      onChange={() => toggleDependency(String(s.phase_number))}
                      className="rounded border-gray-300"
                    />
                    {s.phase_number}. {s.phase_name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stage-activities">Activities (one per line)</Label>
            <Textarea
              id="stage-activities"
              rows={3}
              placeholder="e.g. Audience research&#10;Competitor analysis&#10;KPI setting"
              value={local.activities.join('\n')}
              onChange={(e) => setLocal({ ...local, activities: e.target.value.split('\n').filter(Boolean) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-deliverables">Deliverables (one per line)</Label>
            <Textarea
              id="stage-deliverables"
              rows={2}
              placeholder="e.g. Campaign brief&#10;Audience personas"
              value={local.deliverables.join('\n')}
              onChange={(e) => setLocal({ ...local, deliverables: e.target.value.split('\n').filter(Boolean) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-approvers">Approvers (one per line)</Label>
            <Textarea
              id="stage-approvers"
              rows={2}
              placeholder="e.g. Client&#10;Brand team"
              value={local.approvers.join('\n')}
              onChange={(e) => setLocal({ ...local, approvers: e.target.value.split('\n').filter(Boolean) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!local.phase_name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
