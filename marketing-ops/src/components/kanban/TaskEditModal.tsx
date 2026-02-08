import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import type { MarketerAction } from '@/types/actions'
import type { ExecutionPhase } from '@/types/phase'
import type { AdPlatform, AdPostType } from '@/types/adDeliverable'
import { cn } from '@/lib/utils'

interface TaskEditModalProps {
    task: MarketerAction
    phase?: ExecutionPhase | null
    onSave: (taskId: string, updates: Partial<MarketerAction>) => Promise<void>
    onClose: () => void
}

const PLATFORMS: { value: AdPlatform; label: string }[] = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'youtube', label: 'YouTube' },
]

const POST_TYPES: { value: AdPostType; label: string }[] = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },
]

function isTaskOverdue(task: MarketerAction, phase?: ExecutionPhase | null): boolean {
    if (!phase?.planned_duration_days) return false
    if (task.status === 'completed') return false
    if (!task.started_at) return false

    const storedMinutes = task.time_in_phase_minutes || 0
    const startedAt = new Date(task.started_at)
    const now = new Date()
    const elapsedMs = now.getTime() - startedAt.getTime()
    const elapsedMinutes = Math.floor(elapsedMs / 60000)
    const totalMinutesInPhase = storedMinutes + elapsedMinutes
    const plannedMinutes = phase.planned_duration_days * 8 * 60

    return totalMinutesInPhase > plannedMinutes
}

export function TaskEditModal({ task, phase, onSave, onClose }: TaskEditModalProps) {
    const existingPlatform = (task.metadata?.platform as string) || 'facebook'
    const existingPostType = (task.metadata?.post_type as string) || 'image'

    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [platform, setPlatform] = useState<string>(existingPlatform)
    const [postType, setPostType] = useState<string>(existingPostType)
    const [delayReason, setDelayReason] = useState(task.delay_reason || '')
    const [isSaving, setIsSaving] = useState(false)

    const isOverdue = isTaskOverdue(task, phase)

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
                action_type: 'Ad Deliverable',
                metadata: { platform, post_type: postType },
            }

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
                            {isOverdue ? 'Edit Overdue Ad' : 'Edit Ad Deliverable'}
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
                            <strong>This ad is overdue.</strong> The phase deadline was{' '}
                            {phase?.planned_end_date && new Date(phase.planned_end_date).toLocaleDateString()}.
                            Please provide a reason for the delay.
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Platform & Post Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Platform
                            </label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                {PLATFORMS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Post Type
                            </label>
                            <select
                                value={postType}
                                onChange={(e) => setPostType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                {POST_TYPES.map(pt => (
                                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
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
                                placeholder="Please explain why this ad is delayed..."
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
                                    ? "bg-rose-500 hover:bg-rose-600"
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
