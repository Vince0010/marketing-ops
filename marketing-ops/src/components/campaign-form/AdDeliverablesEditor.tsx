import { Plus, X, Facebook, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { AdDeliverable, AdPlatform, AdPostType } from '@/types/adDeliverable'

interface Props {
  deliverables: AdDeliverable[]
  onChange: (deliverables: AdDeliverable[]) => void
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

const platformIcons: Partial<Record<AdPlatform, typeof Facebook>> = {
  facebook: Facebook,
  instagram: Instagram,
}

export default function AdDeliverablesEditor({ deliverables, onChange }: Props) {
  const addDeliverable = () => {
    onChange([
      ...deliverables,
      {
        tempId: crypto.randomUUID(),
        platform: 'facebook',
        post_type: 'image',
        title: '',
        description: '',
      },
    ])
  }

  const removeDeliverable = (tempId: string) => {
    onChange(deliverables.filter((d) => d.tempId !== tempId))
  }

  const updateDeliverable = (tempId: string, updates: Partial<AdDeliverable>) => {
    onChange(deliverables.map((d) => (d.tempId === tempId ? { ...d, ...updates } : d)))
  }

  return (
    <div className="space-y-4">
      {deliverables.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''} defined
        </p>
      )}

      {deliverables.map((d) => {
        const PlatformIcon = platformIcons[d.platform]
        return (
          <div
            key={d.tempId}
            className="relative border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => removeDeliverable(d.tempId)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 rounded"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Platform & Post Type */}
            <div className="grid grid-cols-2 gap-3 pr-8">
              <div>
                <Label className="text-xs">Platform</Label>
                <select
                  value={d.platform}
                  onChange={(e) => updateDeliverable(d.tempId, { platform: e.target.value as AdPlatform })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Post Type</Label>
                <select
                  value={d.post_type}
                  onChange={(e) => updateDeliverable(d.tempId, { post_type: e.target.value as AdPostType })}
                  className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {POST_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={d.title}
                onChange={(e) => updateDeliverable(d.tempId, { title: e.target.value })}
                placeholder={`e.g. ${d.platform} ${d.post_type} — Summer sale`}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs">Description</Label>
              <textarea
                value={d.description}
                onChange={(e) => updateDeliverable(d.tempId, { description: e.target.value })}
                placeholder="Brief description of the ad content..."
                rows={2}
                className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Preview badge */}
            <div className="flex items-center gap-2 pt-1">
              {PlatformIcon && <PlatformIcon className="w-3.5 h-3.5 text-slate-500" />}
              <Badge variant="secondary" className="text-xs">
                {d.platform} · {d.post_type}
              </Badge>
            </div>
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" onClick={addDeliverable} className="gap-1">
        <Plus className="w-4 h-4" />
        Add Deliverable
      </Button>
    </div>
  )
}
