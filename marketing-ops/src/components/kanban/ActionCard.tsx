import { Clock, User, Tag, AlertCircle, CheckCircle2, Circle, Pause } from 'lucide-react'
import type { MarketerAction } from '@/types/actions'
import { cn } from '@/lib/utils'

interface ActionCardProps {
    task: MarketerAction
    onClick?: () => void
    isDragging?: boolean
}

const statusIcons = {
    planned: Circle,
    in_progress: Clock,
    completed: CheckCircle2,
    blocked: AlertCircle,
    cancelled: Pause,
}

const priorityColors = {
    low: 'bg-slate-500',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    critical: 'bg-red-500',
}

const actionTypeColors: Record<string, string> = {
    creative_asset: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    copy_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    legal_approval: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    platform_setup: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    audience_targeting: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    budget_allocation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    performance_review: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    optimization: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    reporting: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    custom: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
}

export function ActionCard({ task, onClick, isDragging }: ActionCardProps) {
    const StatusIcon = statusIcons[task.status] || Circle

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700",
                "hover:border-slate-300 dark:hover:border-slate-600 cursor-grab transition-all",
                "shadow-sm hover:shadow-md",
                isDragging && "opacity-50 rotate-2 shadow-xl"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    {task.title}
                </h4>
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", priorityColors[task.priority])} />
            </div>

            {/* Type badge */}
            <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2",
                actionTypeColors[task.action_type] || actionTypeColors.custom
            )}>
                {task.action_type.replace(/_/g, ' ')}
            </span>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{task.status.replace(/_/g, ' ')}</span>
                </div>

                {task.assignee && (
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">{task.assignee}</span>
                    </div>
                )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {task.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300"
                        >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                        </span>
                    ))}
                    {task.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{task.tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Due date warning */}
            {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>Overdue</span>
                </div>
            )}
        </div>
    )
}
