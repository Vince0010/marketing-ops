import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import type { MarketerActionInsert } from '@/types/actions'
import type { AdPlatform, AdPostType } from '@/types/adDeliverable'
import { cn } from '@/lib/utils'

interface ActionCardEditorProps {
    campaignId: string
    phaseId: string | null
    phaseName?: string
    onSave: (task: MarketerActionInsert) => Promise<void>
    onCancel: () => void
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

export function ActionCardEditor({ campaignId, phaseId, phaseName, onSave, onCancel }: ActionCardEditorProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [platform, setPlatform] = useState<AdPlatform>('facebook')
    const [postType, setPostType] = useState<AdPostType>('image')
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
                action_type: 'Ad Deliverable',
                priority: 'medium',
                status: phaseId ? 'in_progress' : 'planned',
                phase_id: phaseId,
                phase_name: phaseName,
                timestamp: new Date().toISOString(),
                metadata: { platform, post_type: postType },
            }
            await onSave(taskData)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-rose-400 dark:border-rose-500 shadow-lg">
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        New Ad {phaseName && `in ${phaseName}`}
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Platform & Post Type */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as AdPlatform)}
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        {PLATFORMS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>

                    <select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value as AdPostType)}
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        {POST_TYPES.map(pt => (
                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ad title..."
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    autoFocus
                />

                {/* Description */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ad description (optional)..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />

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
                                ? "bg-rose-500 hover:bg-rose-600"
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
                                Add Ad
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
