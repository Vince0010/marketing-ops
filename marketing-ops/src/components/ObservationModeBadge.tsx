import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ObservationModeBadgeProps {
  /** Risk score at time of override (for tooltip) */
  riskScore?: number
  /** 'in_progress' = active observation; 'completed' = post-campaign */
  campaignStatus?: 'planning' | 'validated' | 'in_progress' | 'completed' | 'paused'
  className?: string
}

export function ObservationModeBadge({
  riskScore,
  campaignStatus,
  className,
}: ObservationModeBadgeProps) {
  const isActive = campaignStatus === 'in_progress' || campaignStatus === 'validated'
  const tooltipText =
    riskScore != null
      ? `Launched despite risk score ${riskScore}`
      : 'Launched despite risk gate override'

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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
