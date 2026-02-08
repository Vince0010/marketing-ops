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
    className: 'border-green-300 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800',
    Icon: CheckCircle2,
  },
  adjust: {
    label: 'Adjust',
    sublabel: 'Needs changes',
    className: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    Icon: AlertTriangle,
  },
  pause: {
    label: 'Pause',
    sublabel: 'Should not proceed',
    className: 'border-red-300 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
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
