import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, Circle, Timer, AlertCircle, XCircle, AlertTriangle, Pencil, Trash2, Facebook, Instagram, MonitorPlay, Linkedin, Twitter, Youtube } from 'lucide-react'
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

const platformConfig: Record<string, { icon: typeof Facebook; color: string; label: string }> = {
    facebook: { icon: Facebook, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Facebook' },
    instagram: { icon: Instagram, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', label: 'Instagram' },
    tiktok: { icon: MonitorPlay, color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200', label: 'TikTok' },
    linkedin: { icon: Linkedin, color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', label: 'LinkedIn' },
    twitter: { icon: Twitter, color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Twitter / X' },
    youtube: { icon: Youtube, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'YouTube' },
}

const postTypeLabels: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    carousel: 'Carousel',
    story: 'Story',
    reel: 'Reel',
}

function getAdInfo(metadata?: Record<string, unknown>): { platform: string | null; postType: string | null } {
    if (!metadata) return { platform: null, postType: null }
    const platform = typeof metadata.platform === 'string' ? metadata.platform : null
    const postType = typeof metadata.post_type === 'string' ? metadata.post_type : null
    return { platform, postType }
}

function calculateTimeInPhase(task: MarketerAction): number {
    const storedMinutes = task.time_in_phase_minutes || 0
    if (task.started_at) {
        const startedAt = new Date(task.started_at)
        const now = new Date()
        const elapsedMs = now.getTime() - startedAt.getTime()
        const elapsedMinutes = Math.floor(elapsedMs / 60000)
        return storedMinutes + elapsedMinutes
    }
    return storedMinutes
}

function formatTime(minutes: number): string {
    if (minutes <= 0) return '0m'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}m`
}

/**
 * Get per-card time budget from the phase's planned duration.
 * Each card gets the full phase duration as its own budget (8-hour workdays).
 */
function getPhaseBudgetMinutes(phase?: ExecutionPhase | null): number | null {
    if (!phase?.planned_duration_days) return null
    return phase.planned_duration_days * 8 * 60
}

export function ActionCard({ task, phase, onClick, isDragging, onEdit, onDelete }: ActionCardProps) {
    // Live timer: tick every 60 seconds to re-render time display
    const [, setTick] = useState(0)
    useEffect(() => {
        // Only run timer for active tasks in a phase
        if (!task.started_at || !task.phase_id || task.status === 'completed' || task.status === 'cancelled') return

        const interval = setInterval(() => {
            setTick(t => t + 1)
        }, 60_000) // every minute

        return () => clearInterval(interval)
    }, [task.started_at, task.phase_id, task.status])

    const StatusIcon = statusIcons[task.status] || Circle
    const { platform, postType } = getAdInfo(task.metadata)
    const platformInfo = platform ? platformConfig[platform] : null
    const PlatformIcon = platformInfo?.icon

    // Time metrics
    const timeSpentMinutes = calculateTimeInPhase(task)
    const budgetMinutes = getPhaseBudgetMinutes(phase)
    const remainingMinutes = budgetMinutes !== null ? Math.max(0, budgetMinutes - timeSpentMinutes) : null
    const percentUsed = budgetMinutes !== null && budgetMinutes > 0
        ? Math.min(Math.round((timeSpentMinutes / budgetMinutes) * 100), 999)
        : null
    const isOverBudget = percentUsed !== null && percentUsed > 100
    const isOverdue = budgetMinutes !== null && timeSpentMinutes > budgetMinutes && task.status !== 'completed'

    // Progress bar color
    const getProgressColor = (pct: number) => {
        if (pct > 100) return 'bg-red-500 dark:bg-red-400'
        if (pct > 80) return 'bg-amber-500 dark:bg-amber-400'
        return 'bg-emerald-500 dark:bg-emerald-400'
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-lg border transition-all group",
                "hover:shadow-md cursor-grab",
                isDragging && "opacity-50 rotate-2 shadow-xl",
                isOverdue
                    ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 border-2 shadow-red-100 dark:shadow-red-900/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
            )}
        >
            {/* Overdue Badge */}
            {isOverdue && (
                <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-100 dark:bg-red-900/40 rounded text-xs font-medium text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Over time budget</span>
                </div>
            )}

            {/* Platform + Post Type badges */}
            {(platformInfo || postType) && (
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {platformInfo && (
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                            platformInfo.color
                        )}>
                            {PlatformIcon && <PlatformIcon className="w-3 h-3" />}
                            {platformInfo.label}
                        </span>
                    )}
                    {postType && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            {postTypeLabels[postType] || postType}
                        </span>
                    )}
                </div>
            )}

            {/* Header with edit/delete buttons */}
            <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={cn(
                    "text-sm font-medium line-clamp-2 flex-1",
                    isOverdue
                        ? "text-red-900 dark:text-red-200"
                        : "text-slate-900 dark:text-slate-100"
                )}>
                    {task.title}
                </h4>
                {(onEdit || onDelete) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="p-1 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Edit"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}

            {/* Time tracker — only for cards assigned to a phase with a budget */}
            {task.phase_id && budgetMinutes !== null && (
                <div className="mb-2 space-y-1.5">
                    {/* Time spent / budget / remaining */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <Timer className={cn(
                                "w-3.5 h-3.5",
                                isOverBudget ? "text-red-500" : "text-slate-500 dark:text-slate-400"
                            )} />
                            <span className={cn(
                                "font-medium",
                                isOverBudget
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-slate-700 dark:text-slate-300"
                            )}>
                                {formatTime(timeSpentMinutes)}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                                / {formatTime(budgetMinutes)}
                            </span>
                        </div>
                        {/* Percentage */}
                        <span className={cn(
                            "text-xs font-semibold",
                            isOverBudget
                                ? "text-red-600 dark:text-red-400"
                                : (percentUsed ?? 0) > 80
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                        )}>
                            {percentUsed}%
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                getProgressColor(percentUsed ?? 0)
                            )}
                            style={{ width: `${Math.min(percentUsed ?? 0, 100)}%` }}
                        />
                    </div>

                    {/* Remaining time */}
                    <div className={cn(
                        "text-xs",
                        isOverBudget
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-slate-500 dark:text-slate-400"
                    )}>
                        {isOverBudget
                            ? `Over by ${formatTime(timeSpentMinutes - budgetMinutes)}`
                            : `${formatTime(remainingMinutes!)} remaining`
                        }
                    </div>
                </div>
            )}

            {/* Time display for cards in a phase WITHOUT a budget (no planned_duration_days) */}
            {task.phase_id && budgetMinutes === null && task.started_at && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium mb-2 bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatTime(timeSpentMinutes)} in phase</span>
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

                {task.status === 'completed' && task.completed_at && (
                    <span className="text-green-600 dark:text-green-400">
                        Done
                    </span>
                )}
            </div>
        </div>
    )
}
