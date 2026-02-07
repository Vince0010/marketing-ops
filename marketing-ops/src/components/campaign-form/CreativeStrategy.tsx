import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CreativeStrategy as CreativeStrategyType } from '@/types/campaign'

const FORMATS = [
  { value: 'static_images', label: 'Static Images' },
  { value: 'video_15s', label: 'Video (15s)' },
  { value: 'video_30s', label: 'Video (30s)' },
  { value: 'video_60s', label: 'Video (60s+)' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'stories_reels', label: 'Stories / Reels' },
  { value: 'collection', label: 'Collection Ads' },
  { value: 'text_based', label: 'Text-Based' },
]

const TESTING_OPTIONS = [
  'A/B test different headlines',
  'A/B test different images/videos',
  'A/B test different CTAs',
  'No testing planned',
]

interface Props {
  data: CreativeStrategyType
  onChange: (data: CreativeStrategyType) => void
}

export default function CreativeStrategy({ data, onChange }: Props) {
  const toggleFormat = (format: string) => {
    const current = data.format || []
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format]
    onChange({ ...data, format: updated })
  }

  const toggleTestingPlan = (plan: string) => {
    const current = data.testing_plan || []
    const updated = current.includes(plan)
      ? current.filter((p) => p !== plan)
      : [...current, plan]
    onChange({ ...data, testing_plan: updated })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Creative Format</Label>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.format || []).includes(value)}
                onChange={() => toggleFormat(value)}
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Creative Theme / Concept</Label>
        <Input
          id="theme"
          placeholder="e.g. Summer vibes, minimalist, bold colors"
          value={data.theme || ''}
          onChange={(e) => onChange({ ...data, theme: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Key Message / Value Prop</Label>
        <Textarea
          id="message"
          placeholder="What's the core message you want to communicate?"
          rows={2}
          value={data.message || ''}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Call-to-Action</Label>
        <Select value={data.cta || ''} onValueChange={(v) => onChange({ ...data, cta: v })}>
          <SelectTrigger><SelectValue placeholder="Select CTA" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="shop_now">Shop Now</SelectItem>
            <SelectItem value="learn_more">Learn More</SelectItem>
            <SelectItem value="sign_up">Sign Up</SelectItem>
            <SelectItem value="download">Download</SelectItem>
            <SelectItem value="get_offer">Get Offer</SelectItem>
            <SelectItem value="book_now">Book Now</SelectItem>
            <SelectItem value="contact_us">Contact Us</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Creative Testing Plan</Label>
        <div className="space-y-2">
          {TESTING_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.testing_plan || []).includes(option)}
                onChange={() => toggleTestingPlan(option)}
                className="rounded border-gray-300"
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
