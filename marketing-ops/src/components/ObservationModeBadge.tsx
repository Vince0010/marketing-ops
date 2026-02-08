import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Eye, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ObservationModeBadgeProps {
  /** Risk score at time of override (for tooltip) */
  riskScore?: number
  /** 'in_progress' = active observation; 'completed' = post-campaign */
  campaignStatus?: 'planning' | 'validated' | 'in_progress' | 'completed' | 'paused'
  /** Campaign start and end dates for milestone calculation */
  startDate?: string
  endDate?: string
  className?: string
  /** Show full monitoring alert instead of just badge */
  showFullAlert?: boolean
}

export function ObservationModeBadge({
  riskScore,
  campaignStatus,
  startDate,
  endDate,
  className,
  showFullAlert = false,
}: ObservationModeBadgeProps) {
  const isActive = campaignStatus === 'in_progress' || campaignStatus === 'validated'
  const tooltipText =
    riskScore != null
      ? `Launched despite risk score ${riskScore}`
      : 'Launched despite risk gate override'

  // Calculate milestone progress
  const getMilestoneInfo = () => {
    if (!startDate || !endDate || !isActive) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, totalDays - daysPassed)
    const progressPercent = Math.min(100, Math.round((daysPassed / totalDays) * 100))

    return {
      daysPassed,
      totalDays,
      daysRemaining,
      progressPercent,
    }
  }

  const milestone = getMilestoneInfo()

  // If showing full alert with milestone checkpoints
  if (showFullAlert && isActive) {
    return (
      <Alert className="border-blue-300 bg-blue-50">
        <Eye className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center gap-2">
          <span>Observation Mode Active</span>
          <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-700">
            Monitoring
          </Badge>
        </AlertTitle>
        <AlertDescription className="space-y-2 text-blue-700">
          <p>
            We're monitoring this campaign closely since you proceeded against the system recommendation.
            Performance data is being tracked to validate the override decision.
          </p>
          {milestone && (
            <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                Day {milestone.daysPassed} of {milestone.totalDays}
              </span>
              <span className="text-blue-600">
                ({milestone.daysRemaining} days remaining, {milestone.progressPercent}% complete)
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'font-medium text-xs shrink-0 gap-1.5 cursor-help',
              isActive
                ? 'border-expedition-signal/50 bg-expedition-signal/10 text-expedition-signal'
                : 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
              className
            )}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden />
            OBSERVATION MODE
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipText}
          {campaignStatus === 'completed' && (
            <span className="block mt-1 text-muted-foreground text-[10px]">
              Campaign completed — review outcomes in Analytics
            </span>
          )}
          {milestone && isActive && (
            <span className="block mt-1 text-muted-foreground text-[10px]">
              Day {milestone.daysPassed} of {milestone.totalDays} • {milestone.daysRemaining} days remaining
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
