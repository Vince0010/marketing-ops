import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import type { MarketerActionInsert, ActionPriority } from '@/types/actions'
import { cn } from '@/lib/utils'

interface ActionCardEditorProps {
    campaignId: string
    phaseId: string | null
    phaseName?: string
    onSave: (task: MarketerActionInsert) => Promise<void>
    onCancel: () => void
}

// Common action types as suggestions - users can also enter custom types
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

export function ActionCardEditor({ campaignId, phaseId, phaseName, onSave, onCancel }: ActionCardEditorProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [actionType, setActionType] = useState('Custom')
    const [priority, setPriority] = useState<ActionPriority>('medium')
    const [assignee, setAssignee] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [estimatedHours, setEstimatedHours] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSaving(true)
        try {
            const taskData: MarketerActionInsert = {
                campaign_id: campaignId,
                title: title.trim(),
                description: description.trim() || undefined,
                action_type: actionType,
                priority,
                status: phaseId ? 'in_progress' : 'planned',
                phase_id: phaseId,
                phase_name: phaseName,
                timestamp: new Date().toISOString(),
                assignee: assignee.trim() || undefined,
                due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
                estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
            }
            await onSave(taskData)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-400 dark:border-blue-500 shadow-lg">
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        New Task {phaseName && `in ${phaseName}`}
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                />

                {/* Description */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {COMMON_ACTION_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as ActionPriority)}
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {priorities.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {/* Assignee & Due Date */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="Assignee (optional)..."
                        className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Estimated Hours */}
                <div className="mb-3">
                    <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        placeholder="Estimated hours (optional)..."
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim() || isSaving}
                        className={cn(
                            "px-3 py-1.5 text-xs text-white rounded flex items-center gap-1",
                            title.trim() && !isSaving
                                ? "bg-blue-500 hover:bg-blue-600"
                                : "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" />
                                Add Task
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
