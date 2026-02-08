import { Clock, CheckCircle2, Circle, Timer, AlertCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { MarketerAction } from '@/types/actions'
import type { ExecutionPhase } from '@/types/phase'
import { cn } from '@/lib/utils'

interface ActionCardProps {
    task: MarketerAction
    phase?: ExecutionPhase | null
    onClick?: () => void
    isDragging?: boolean
}

const statusIcons = {
    planned: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    blocked: AlertCircle,
    cancelled: XCircle,
}

const actionTypeColors: Record<string, string> = {
    creative_change: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ad_copy_update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    budget_adjustment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    audience_targeting: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    bidding_strategy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    placement_change: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    posting_schedule_change: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    other: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
}

/**
 * Calculate time in phase from started_at or use stored time_in_phase_minutes
 */
function calculateTimeInPhase(task: MarketerAction): number {
    // If we have stored time_in_phase_minutes, use it as base
    const storedMinutes = task.time_in_phase_minutes || 0

    // If task has started_at, calculate additional elapsed time
    if (task.started_at) {
        const startedAt = new Date(task.started_at)
        const now = new Date()
        const elapsedMs = now.getTime() - startedAt.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / 60000)
        return storedMinutes + elapsedMinutes
    }

    return storedMinutes
}

/**
 * Format minutes into human-readable string
 */
function formatTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) {
        return `${hours}h`
    }
    return `${hours}h ${remainingMins}m`
}

/**
 * Check if a task is overdue based on time spent in phase vs planned duration
 * A task is overdue if it has been in the phase longer than the phase's planned duration
 */
function isTaskOverdue(task: MarketerAction, phase?: ExecutionPhase | null): boolean {
    if (!phase?.planned_duration_days) return false
    if (task.status === 'completed') return false
    if (!task.started_at) return false // Task hasn't started in this phase yet

    // Calculate time spent in phase (in minutes)
    const storedMinutes = task.time_in_phase_minutes || 0
    const startedAt = new Date(task.started_at)
    const now = new Date()
    const elapsedMs = now.getTime() - startedAt.getTime()
    const elapsedMinutes = Math.floor(elapsedMs / 60000)
    const totalMinutesInPhase = storedMinutes + elapsedMinutes

    // Convert planned duration to minutes (8-hour workdays)
    const plannedMinutes = phase.planned_duration_days * 8 * 60

    return totalMinutesInPhase > plannedMinutes
}

export function ActionCard({ task, phase, onClick, isDragging }: ActionCardProps) {
    const StatusIcon = statusIcons[task.status] || Circle
    const isOverdue = isTaskOverdue(task, phase)

    // Calculate time metrics
    const timeInPhaseMinutes = calculateTimeInPhase(task)
    const estimatedMinutes = task.estimated_hours ? task.estimated_hours * 60 : null

    // Determine if over/under estimate
    const isOverEstimate = estimatedMinutes !== null && timeInPhaseMinutes > estimatedMinutes
    const percentOfEstimate = estimatedMinutes
        ? Math.round((timeInPhaseMinutes / estimatedMinutes) * 100)
        : null

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-lg border transition-all",
                "hover:shadow-md cursor-grab",
                isDragging && "opacity-50 rotate-2 shadow-xl",
                // Overdue styling - red border and background
                isOverdue
                    ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 border-2 shadow-red-100 dark:shadow-red-900/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
            )}
        >
            {/* Overdue Badge */}
            {isOverdue && (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs font-medium text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdue</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className={cn(
                    "text-sm font-medium line-clamp-2",
                    isOverdue
                        ? "text-red-900 dark:text-red-200"
                        : "text-slate-900 dark:text-slate-100"
                )}>
                    {task.title}
                </h4>
            </div>

            {/* Type badge */}
            <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2",
                actionTypeColors[task.action_type] || actionTypeColors.other
            )}>
                {task.action_type.replace(/_/g, ' ')}
            </span>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}

            {/* Time in phase indicator */}
            {task.phase_id && (
                <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium mb-2",
                    isOverEstimate
                        ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                )}>
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatTime(timeInPhaseMinutes)} in phase</span>
                    {estimatedMinutes && (
                        <span className="text-slate-400 dark:text-slate-500">
                            / Est: {formatTime(estimatedMinutes)}
                        </span>
                    )}
                    {percentOfEstimate !== null && percentOfEstimate > 100 && (
                        <span className="ml-auto text-red-600 dark:text-red-400 font-semibold">
                            +{percentOfEstimate - 100}%
                        </span>
                    )}
                </div>
            )}

            {/* Delay reason indicator */}
            {task.delay_reason && (
                <div className="flex items-start gap-1.5 mb-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{task.delay_reason}</span>
                </div>
            )}

            {/* Footer: Status */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{task.status.replace(/_/g, ' ')}</span>
                </div>

                {/* Show completed_at if completed */}
                {task.status === 'completed' && task.completed_at && (
                    <span className="text-green-600 dark:text-green-400">
                        ✓ Done
                    </span>
                )}
            </div>
        </div>
    )
}

