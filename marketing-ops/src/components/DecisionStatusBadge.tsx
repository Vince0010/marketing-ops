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
    className: 'border-expedition-evergreen/40 bg-expedition-evergreen/10 text-expedition-evergreen',
    Icon: CheckCircle2,
  },
  adjust: {
    label: 'Adjust',
    sublabel: 'Needs changes',
    className: 'border-expedition-signal/40 bg-expedition-signal/10 text-expedition-signal',
    Icon: AlertTriangle,
  },
  pause: {
    label: 'Pause',
    sublabel: 'Should not proceed',
    className: 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10 text-expedition-checkpoint',
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
