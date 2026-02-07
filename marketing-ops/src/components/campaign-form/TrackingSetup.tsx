import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TrackingSetup as TrackingSetupType } from '@/types/campaign'

const CONVERSION_EVENTS = ['Purchase', 'Add to Cart', 'Lead', 'Complete Registration']
const BRAND_TRACKING = [
  { value: 'google_trends', label: 'Track Google Trends' },
  { value: 'tiktok_hashtag', label: 'Track TikTok hashtag' },
  { value: 'youtube_search', label: 'Track YouTube search volume' },
  { value: 'branded_search', label: 'Track branded search lift' },
]

interface Props {
  data: TrackingSetupType & { meta_pixel_id: string; meta_ads_account_id: string }
  onChange: (data: Partial<TrackingSetupType & { meta_pixel_id: string; meta_ads_account_id: string }>) => void
}

export default function TrackingSetup({ data, onChange }: Props) {
  const toggleItem = (key: 'conversion_events' | 'brand_awareness_tracking', item: string) => {
    const current = (data[key] || []) as string[]
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item]
    onChange({ [key]: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Meta Ads Tracking</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pixel_id">Meta Pixel ID</Label>
            <Input
              id="pixel_id"
              placeholder="Enter Pixel ID"
              value={data.meta_pixel_id}
              onChange={(e) => onChange({ meta_pixel_id: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ads_account_id">Ads Account ID</Label>
            <Input
              id="ads_account_id"
              placeholder="Enter Ads Account ID"
              value={data.meta_ads_account_id}
              onChange={(e) => onChange({ meta_ads_account_id: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Custom Conversion Events</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONVERSION_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.conversion_events || []).includes(event)}
                  onChange={() => toggleItem('conversion_events', event)}
                  className="rounded border-gray-300"
                />
                {event}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">External Tracking</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.google_analytics ?? false}
              onChange={(e) => onChange({ google_analytics: e.target.checked })}
              className="rounded border-gray-300"
            />
            Google Analytics
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.crm_integration ?? false}
              onChange={(e) => onChange({ crm_integration: e.target.checked })}
              className="rounded border-gray-300"
            />
            CRM Integration
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="utm">UTM Parameters</Label>
            <Input
              id="utm"
              placeholder="e.g. utm_source=meta&utm_medium=paid"
              value={data.utm_parameters || ''}
              onChange={(e) => onChange({ utm_parameters: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo_code">Promo Code (for attribution)</Label>
            <Input
              id="promo_code"
              placeholder="e.g. SUMMER25"
              value={data.promo_code || ''}
              onChange={(e) => onChange({ promo_code: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Brand Awareness Tracking</h4>
        <div className="space-y-2">
          {BRAND_TRACKING.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.brand_awareness_tracking || []).includes(value)}
                onChange={() => toggleItem('brand_awareness_tracking', value)}
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
