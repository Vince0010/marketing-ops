import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ChannelPlacement as ChannelPlacementType } from '@/types/campaign'

const FB_PLACEMENTS = [
  { value: 'feed', label: 'Feed' },
  { value: 'stories', label: 'Stories' },
  { value: 'reels', label: 'Reels' },
  { value: 'right_column', label: 'Right Column' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'video_feeds', label: 'Video Feeds' },
]

const IG_PLACEMENTS = [
  { value: 'feed', label: 'Feed' },
  { value: 'stories', label: 'Stories' },
  { value: 'reels', label: 'Reels' },
  { value: 'explore', label: 'Explore' },
]

interface Props {
  data: ChannelPlacementType
  onChange: (data: ChannelPlacementType) => void
}

export default function ChannelPlacement({ data, onChange }: Props) {
  const togglePlacement = (platform: 'facebook' | 'instagram', placement: string) => {
    const key = platform === 'facebook' ? 'facebook_placements' : 'instagram_placements'
    const current = data[key] || []
    const updated = current.includes(placement)
      ? current.filter((p) => p !== placement)
      : [...current, placement]
    onChange({ ...data, [key]: updated })
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Primary Platform: Meta Ads (Facebook / Instagram)
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={data.automatic_placements ?? false}
            onChange={(e) => onChange({ ...data, automatic_placements: e.target.checked })}
            className="rounded border-gray-300"
          />
          Use Automatic Placements (recommended)
        </label>
      </div>

      {!data.automatic_placements && (
        <>
          <div className="space-y-2">
            <Label>Facebook Placements</Label>
            <div className="grid grid-cols-3 gap-2">
              {FB_PLACEMENTS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(data.facebook_placements || []).includes(value)}
                    onChange={() => togglePlacement('facebook', value)}
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instagram Placements</Label>
            <div className="grid grid-cols-2 gap-2">
              {IG_PLACEMENTS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(data.instagram_placements || []).includes(value)}
                    onChange={() => togglePlacement('instagram', value)}
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Optimization Goal</Label>
        <Select
          value={data.optimization_goal || ''}
          onValueChange={(v) => onChange({ ...data, optimization_goal: v as ChannelPlacementType['optimization_goal'] })}
        >
          <SelectTrigger><SelectValue placeholder="Select optimization goal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="conversions">Conversions</SelectItem>
            <SelectItem value="link_clicks">Link Clicks</SelectItem>
            <SelectItem value="reach">Reach</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="video_views">Video Views</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
