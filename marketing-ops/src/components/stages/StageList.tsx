import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { StageConfig } from '@/types/phase'

interface Props {
  stages: StageConfig[]
  onMove: (fromIndex: number, direction: 'up' | 'down') => void
  onEdit: (tempId: string) => void
  onRemove: (tempId: string) => void
}

export default function StageList({ stages, onMove, onEdit, onRemove }: Props) {
  return (
    <div className="space-y-2">
      {stages.map((stage, index) => (
        <div
          key={stage.tempId}
          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={index === 0}
              onClick={() => onMove(index, 'up')}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={index === stages.length - 1}
              onClick={() => onMove(index, 'down')}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Phase number */}
          <Badge variant="outline" className="min-w-[28px] justify-center">
            {stage.phase_number}
          </Badge>

          {/* Stage info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{stage.phase_name}</div>
            <div className="text-xs text-muted-foreground">
              {stage.planned_duration_days} day{stage.planned_duration_days !== 1 ? 's' : ''}
              {stage.owner && ` · ${stage.owner}`}
            </div>
          </div>

          {/* Type badge */}
          <Badge variant="secondary" className="text-xs">
            {stage.phase_type}
          </Badge>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(stage.tempId)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(stage.tempId)}
              disabled={stages.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
