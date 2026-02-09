import { Clock, CheckCircle2, Circle, Timer, AlertCircle, XCircle, AlertTriangle, User, Calendar, Pencil, Trash2 } from 'lucide-react'
import type { MarketerAction } from '@/types/actions'
import type { ExecutionPhase } from '@/types/phase'
import { cn } from '@/lib/utils'

interface ActionCardProps {
    task: MarketerAction
    phase?: ExecutionPhase | null
    onClick?: () => void
    isDragging?: boolean
    onEdit?: (e: React.MouseEvent) => void
    onDelete?: (e: React.MouseEvent) => void
}

const statusIcons = {
    planned: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    blocked: AlertCircle,
    cancelled: XCircle,
}

const actionTypeColors: Record<string, string> = {
    creative_change: 'bg-purple-100 text-purple-800',
    ad_copy_update: 'bg-blue-100 text-blue-800',
    budget_adjustment: 'bg-amber-100 text-amber-800',
    audience_targeting: 'bg-cyan-100 text-cyan-800',
    bidding_strategy: 'bg-green-100 text-green-800',
    placement_change: 'bg-indigo-100 text-indigo-800',
    posting_schedule_change: 'bg-teal-100 text-teal-800',
    other: 'bg-slate-100 text-slate-800',
}

const priorityColors: Record<string, string> = {
    low: 'bg-slate-200',
    medium: 'bg-blue-200',
    high: 'bg-amber-200',
    critical: 'bg-red-200',
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

function formatDueDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays}d`
}

export function ActionCard({ task, phase, onClick, isDragging, onEdit, onDelete }: ActionCardProps) {
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

    // Check if due date is past
    const isDueDateOverdue = task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'completed' : false

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-lg border transition-all group",
                "hover:shadow-md cursor-grab",
                isDragging && "opacity-50 rotate-2 shadow-xl",
                // Overdue styling - red border and background
                isOverdue
                    ? "bg-red-50 border-[#26532B] border-2 shadow-red-100"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            )}
        >
            {/* Overdue Badge */}
            {isOverdue && (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-100 rounded text-xs font-medium text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdue</span>
                </div>
            )}

            {/* Header with edit/delete buttons */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className={cn(
                    "text-sm font-medium line-clamp-2 flex-1",
                    isOverdue
                        ? "text-red-900"
                        : "text-slate-900"
                )}>
                    {task.title}
                </h4>
                {(onEdit || onDelete) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-1 text-slate-400 hover:text-[#347698] rounded hover:bg-slate-100"
                                title="Edit task"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-1 text-slate-400 hover:text-[#1B3D20] rounded hover:bg-slate-100"
                                title="Delete task"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Priority indicator + Type badge */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {task.priority && task.priority !== 'medium' && (
                    <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                        task.priority === 'critical' && "bg-red-100 text-red-700",
                        task.priority === 'high' && "bg-amber-100 text-amber-700",
                        task.priority === 'low' && "bg-slate-100 text-slate-600",
                    )}>
                        {task.priority}
                    </span>
                )}
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    actionTypeColors[task.action_type] || actionTypeColors.other
                )}>
                    {task.action_type.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}

            {/* Assignee */}
            {task.assignee && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <User className="w-3 h-3" />
                    <span>{task.assignee}</span>
                </div>
            )}

            {/* Due date */}
            {task.due_date && (
                <div className={cn(
                    "flex items-center gap-1.5 text-xs mb-2",
                    isDueDateOverdue
                        ? "text-[#1B3D20] font-medium"
                        : "text-slate-500"
                )}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDueDate(task.due_date)}</span>
                </div>
            )}

            {/* Estimated hours (always show if set, even without phase) */}
            {task.estimated_hours && !task.phase_id && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium mb-2 bg-slate-50 text-slate-600">
                    <Timer className="w-3.5 h-3.5" />
                    <span>Est: {task.estimated_hours}h</span>
                </div>
            )}

            {/* Time in phase indicator (for tasks assigned to a phase) */}
            {task.phase_id && (
                <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium mb-2",
                    isOverEstimate
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                )}>
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatTime(timeInPhaseMinutes)} in phase</span>
                    {estimatedMinutes && (
                        <span className="text-slate-400">
                            / Est: {formatTime(estimatedMinutes)}
                        </span>
                    )}
                    {percentOfEstimate !== null && percentOfEstimate > 100 && (
                        <span className="ml-auto text-[#1B3D20] font-semibold">
                            +{percentOfEstimate - 100}%
                        </span>
                    )}
                </div>
            )}

            {/* Delay reason indicator */}
            {task.delay_reason && (
                <div className="flex items-start gap-1.5 mb-2 px-2 py-1.5 bg-[#26532B]/10 rounded text-xs text-[#26532B]">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{task.delay_reason}</span>
                </div>
            )}

            {/* Footer: Status + priority dot */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{task.status.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Priority dot */}
                    <span className={cn("w-2 h-2 rounded-full", priorityColors[task.priority] || priorityColors.medium)} />

                    {/* Show completed_at if completed */}
                    {task.status === 'completed' && task.completed_at && (
                        <span className="text-green-600">
                            ✓ Done
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
