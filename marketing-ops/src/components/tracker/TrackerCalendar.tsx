import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExecutionPhase } from '@/types/phase'
import { cn } from '@/lib/utils'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface TrackerCalendarProps {
  phases: ExecutionPhase[]
  campaignStart?: string
  campaignEnd?: string
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days = last.getDate()
  return { first, last, days }
}

function parseDate(s: string) {
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function TrackerCalendar({ phases }: TrackerCalendarProps) {
  const viewStart = phases.length > 0 ? parseDate(phases[0].planned_start_date) : new Date()
  const [viewMonth, setViewMonth] = useState(() => ({ year: viewStart.getFullYear(), month: viewStart.getMonth() }))

  const { days } = useMemo(
    () => getDaysInMonth(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month]
  )

  const phaseBars = useMemo(() => {
    const viewFirst = new Date(viewMonth.year, viewMonth.month, 1)
    const viewLast = new Date(viewMonth.year, viewMonth.month + 1, 0)
    return phases.map((phase) => {
      const start = parseDate(phase.planned_start_date)
      const end = parseDate(phase.planned_end_date)
      const barStart = start < viewFirst ? 1 : start.getDate()
      const barEnd = end > viewLast ? days : end.getDate()
      const startCol = Math.max(1, barStart)
      const endCol = Math.min(days, barEnd)
      const span = endCol - startCol + 1
      const leftPct = ((startCol - 1) / days) * 100
      const widthPct = (span / days) * 100
      return { phase, leftPct, widthPct }
    })
  }, [phases, viewMonth, days])

  const goPrev = () => {
    setViewMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))
  }
  const goNext = () => {
    setViewMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))
  }

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500',
    in_progress: 'bg-blue-500',
    pending: 'bg-muted',
    blocked: 'bg-red-500',
  }

  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No phases to display. Add phases in the Execution Timeline.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {MONTH_NAMES[viewMonth.month]} {viewMonth.year}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid text-xs border-b bg-muted/50" style={{ gridTemplateColumns: `120px repeat(${days}, minmax(0, 1fr))` }}>
          <div className="p-2 font-medium">Phase</div>
          {Array.from({ length: days }, (_, i) => (
            <div key={i} className="p-1 text-center">
              {i + 1}
            </div>
          ))}
        </div>
        {phaseBars.map(({ phase, leftPct, widthPct }) => (
          <div
            key={phase.id}
            className="grid border-b last:border-b-0 items-center"
            style={{ gridTemplateColumns: `120px repeat(${days}, minmax(0, 1fr))` }}
          >
            <div className="p-2 flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">{phase.phase_name}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {phase.status}
              </Badge>
            </div>
            <div className="relative h-8" style={{ gridColumn: '2 / -1' }}>
              <div className="absolute inset-0 flex">
                {Array.from({ length: days }, (_, i) => (
                  <div key={i} className="flex-1 border-l border-border/50" />
                ))}
              </div>
              <div
                className={cn(
                  'absolute top-1 bottom-1 rounded min-w-[4px] flex items-center px-2 text-white text-xs font-medium truncate',
                  statusColors[phase.status] ?? 'bg-muted'
                )}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                }}
                title={`${phase.planned_start_date} → ${phase.planned_end_date}${phase.drift_days !== 0 ? ` (${phase.drift_days > 0 ? '+' : ''}${phase.drift_days}d)` : ''}`}
              >
                {phase.phase_name}
                {phase.drift_days !== 0 && phase.status === 'completed' && (
                  <span className="ml-1 opacity-90">
                    {phase.drift_days > 0 ? '+' : ''}{phase.drift_days}d
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Bars show planned phase dates. Overlaps and gaps indicate scheduling issues. Navigate with arrows to see other months.
      </p>
    </div>
  )
}
