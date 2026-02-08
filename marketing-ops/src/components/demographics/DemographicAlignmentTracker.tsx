import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AgeRow {
  range: string
  goal: number
  actual: number
  diff: number
}

export interface DemographicAlignmentTrackerProps {
  /** Age distribution: goal %, actual %, diff */
  ageData: AgeRow[]
  /** Overall fit score 0-100 */
  fitScore: number
  /** Strong alignment bullets */
  strongAlignment: string[]
  /** Adjustment areas (underperforming) */
  adjustmentAreas: string[]
  /** Recommended actions */
  recommendedActions: string[]
  /** Optional: "Preliminary" vs "Final" analysis */
  variant?: 'preliminary' | 'final'
  /** Compact layout for Tracker (single column, smaller) */
  compact?: boolean
}

function alignmentPercent(diff: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - Math.abs(diff))))
}

export function DemographicAlignmentTracker({
  ageData,
  fitScore,
  strongAlignment,
  adjustmentAreas,
  recommendedActions,
  variant,
  compact = false,
}: DemographicAlignmentTrackerProps) {
  return (
    <Card className={cn(compact && 'border-border')}>
      <CardHeader className={compact ? 'py-3' : ''}>
        <CardTitle className={cn('flex items-center gap-2', compact && 'text-base')}>
          <Target className="w-4 h-4" />
          Audience Insights
        </CardTitle>
        <CardDescription>
          {variant === 'preliminary'
            ? 'Preliminary demographic alignment (first 7+ days)'
            : variant === 'final'
              ? 'Final demographic alignment'
              : 'Target vs actual audience delivery'}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn('space-y-4', compact && 'space-y-3')}>
        {/* Age distribution: TARGET vs ACTUAL on same 0–100% scale */}
        <div>
          <p className="text-sm font-medium mb-2">
            Age distribution: target vs actual
          </p>
          <div className="space-y-3">
            {ageData.map((row) => {
              const alignment = alignmentPercent(row.diff)
              const goalPct = row.goal
              const actualPct = row.actual
              return (
                <div key={row.range} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium w-12">{row.range}</span>
                    <span
                      className={cn(
                        'w-14 text-right',
                        row.diff > 0 && 'text-expedition-evergreen',
                        row.diff < 0 && 'text-expedition-checkpoint',
                        row.diff === 0 && 'text-muted-foreground'
                      )}
                    >
                      {alignment}% alignment
                    </span>
                  </div>
                  {/* Target bar: 0–100% scale. Blue = planned share of audience. */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Target</span>
                    <div className="flex-1 h-4 rounded bg-muted/50 dark:bg-muted/20 overflow-hidden" role="img" aria-label={`${row.range} target ${goalPct}%`}>
                      <div
                        className="h-full bg-primary rounded-l transition-all"
                        style={{ width: `${goalPct}%`, minWidth: goalPct > 0 ? '6px' : 0 }}
                        title={`Planned: ${goalPct}% of audience`}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-8">{goalPct}%</span>
                  </div>
                  {/* Actual bar: 0–100% scale. Green = hit/beat target, Amber = below target. */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Actual</span>
                    <div className="flex-1 h-4 rounded bg-muted/50 dark:bg-muted/20 overflow-hidden" role="img" aria-label={`${row.range} actual ${actualPct}%`}>
                      <div
                        className={cn(
                          'h-full rounded-l transition-all',
                          row.diff >= 0 ? 'bg-expedition-evergreen' : 'bg-expedition-signal'
                        )}
                        style={{ width: `${actualPct}%`, minWidth: actualPct > 0 ? '6px' : 0 }}
                        title={row.diff >= 0 ? `Achieved: ${actualPct}% (at or above target)` : `Achieved: ${actualPct}% (below target)`}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-8">{actualPct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Audience Fit Score */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={cn(
                'rounded-full border-4 flex items-center justify-center bg-primary/10 dark:bg-primary/20',
                compact ? 'w-14 h-14 border-primary' : 'w-20 h-20 border-primary'
              )}
            >
              <span className={cn('font-bold text-primary', compact ? 'text-lg' : 'text-2xl')}>
                {fitScore}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">/ 100</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Audience fit score
          </div>
        </div>

        {/* Simplified insights */}
        <div className={cn('grid gap-3', !compact && 'grid-cols-1 md:grid-cols-3')}>
          <div className="rounded-lg border border-expedition-evergreen/40 bg-expedition-evergreen/10 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-expedition-evergreen flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Strong alignment
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {strongAlignment.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-expedition-signal/40 bg-expedition-signal/10 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-expedition-signal flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Adjustment areas
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {adjustmentAreas.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-primary" /> Recommended actions
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {recommendedActions.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
