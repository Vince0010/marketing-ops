import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DecisionStatus = 'proceed' | 'adjust' | 'pause'

const CONFIG: Record<
  DecisionStatus,
  { label: string; sublabel: string; className: string; Icon: typeof CheckCircle2 }
> = {
  proceed: {
    label: 'Proceed',
    sublabel: 'Good to launch',
    // Positive approval: success green
    className:
      'border-[#26532B]/40 bg-[#26532B]/10 text-[#26532B]',
    Icon: CheckCircle2,
  },
  adjust: {
    label: 'Adjust',
    sublabel: 'Needs changes',
    // Attention required: sky blue accent
    className:
      'border-[#50A6C9]/40 bg-[#50A6C9]/10 text-[#347698]',
    Icon: AlertTriangle,
  },
  pause: {
    label: 'Pause',
    sublabel: 'Should not proceed',
    // Neutral / paused: structured warm gray
    className:
      'border-[#9F9F9D]/40 bg-[#9F9F9D]/10 text-[#1C486F]',
    Icon: XCircle,
  },
}

interface DecisionStatusBadgeProps {
  decision: DecisionStatus
  /** Show sublabel (e.g. "Good to launch") - default true when prominent */
  showSublabel?: boolean
  /** Larger badge for decision card - default false for compact (e.g. dashboard) */
  prominent?: boolean
  className?: string
}

export function DecisionStatusBadge({
  decision,
  showSublabel = false,
  prominent = false,
  className,
}: DecisionStatusBadgeProps) {
  const { label, sublabel, className: configClass, Icon } = CONFIG[decision]

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold shrink-0',
        configClass,
        prominent && 'px-4 py-1.5 text-sm gap-2',
        !prominent && 'px-2.5 py-0.5 text-xs gap-1.5',
        className
      )}
    >
      <Icon className={prominent ? 'w-4 h-4' : 'w-3.5 h-3.5'} aria-hidden />
      <span>{label}</span>
      {showSublabel && sublabel && (
        <span className={cn('font-normal opacity-90', !prominent && 'hidden sm:inline')}>
          — {sublabel}
        </span>
      )}
    </Badge>
  )
}
