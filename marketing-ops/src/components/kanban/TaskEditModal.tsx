import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, Calendar } from 'lucide-react'
import type { MarketerAction, ActionPriority } from '@/types/actions'
import type { ExecutionPhase } from '@/types/phase'
import { cn } from '@/lib/utils'

interface TaskEditModalProps {
    task: MarketerAction
    phase?: ExecutionPhase | null
    onSave: (taskId: string, updates: Partial<MarketerAction>) => Promise<void>
    onClose: () => void
}

const COMMON_ACTION_TYPES = [
    'Creative Asset',
    'Copy Review',
    'Legal Approval',
    'Platform Setup',
    'Audience Targeting',
    'Budget Allocation',
    'Performance Review',
    'Optimization',
    'Reporting',
    'Custom',
]

const priorities: { value: ActionPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-slate-500' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500' },
    { value: 'high', label: 'High', color: 'bg-amber-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500' },
]

/**
 * Check if a task is overdue based on time spent in phase vs planned duration
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

export function TaskEditModal({ task, phase, onSave, onClose }: TaskEditModalProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [actionType, setActionType] = useState(task.action_type)
    const [priority, setPriority] = useState<ActionPriority>(task.priority)
    const [assignee, setAssignee] = useState(task.assignee || '')
    const [dueDate, setDueDate] = useState(task.due_date?.split('T')[0] || '')
    const [delayReason, setDelayReason] = useState(task.delay_reason || '')
    const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() || '')
    const [isSaving, setIsSaving] = useState(false)

    const isOverdue = isTaskOverdue(task, phase)

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [onClose])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSaving(true)
        try {
            const updates: Partial<MarketerAction> = {
                title: title.trim(),
                description: description.trim() || undefined,
                action_type: actionType,
                priority,
                assignee: assignee.trim() || undefined,
                due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
                estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            }

            // Include delay reason if task is overdue
            if (isOverdue && delayReason.trim()) {
                updates.delay_reason = delayReason.trim()
            }

            await onSave(task.id, updates)
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between px-6 py-4 border-b",
                    isOverdue
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "border-slate-200 dark:border-slate-700"
                )}>
                    <div className="flex items-center gap-3">
                        {isOverdue && (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <h2 className={cn(
                            "text-lg font-semibold",
                            isOverdue
                                ? "text-red-700 dark:text-red-400"
                                : "text-slate-800 dark:text-slate-100"
                        )}>
                            {isOverdue ? 'Edit Overdue Task' : 'Edit Task'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Overdue Warning Banner */}
                {isOverdue && (
                    <div className="px-6 py-3 bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400">
                            <strong>This task is overdue.</strong> The phase deadline was{' '}
                            {phase?.planned_end_date && new Date(phase.planned_end_date).toLocaleDateString()}.
                            Please provide a reason for the delay.
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Type
                            </label>
                            <select
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {COMMON_ACTION_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {priorities.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee & Estimated Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Assignee
                            </label>
                            <input
                                type="text"
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                placeholder="Name or email..."
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={estimatedHours}
                                onChange={(e) => setEstimatedHours(e.target.value)}
                                placeholder="e.g. 4"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Delay Reason (shown when overdue) */}
                    {isOverdue && (
                        <div>
                            <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Reason for Delay *
                            </label>
                            <textarea
                                value={delayReason}
                                onChange={(e) => setDelayReason(e.target.value)}
                                rows={2}
                                placeholder="Please explain why this task is delayed..."
                                className="w-full px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                required={isOverdue}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || isSaving || (isOverdue && !delayReason.trim())}
                            className={cn(
                                "px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2",
                                title.trim() && !isSaving && (!isOverdue || delayReason.trim())
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
