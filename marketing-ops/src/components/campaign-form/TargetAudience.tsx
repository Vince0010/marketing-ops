import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TargetAudience as TargetAudienceType } from '@/types/campaign'

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const INTERESTS = ['Fitness', 'Technology', 'Fashion', 'Food & Dining', 'Travel', 'Home & Garden', 'Sports', 'Music', 'Gaming', 'Beauty']
const BEHAVIORS = ['Online Shoppers', 'Early Adopters', 'Price-Sensitive', 'Brand Loyal', 'Mobile-First', 'Social Media Active']
const LIFE_EVENTS = ['New Parents', 'Recently Moved', 'Job Change', 'Newly Engaged', 'Recently Graduated', 'Retirement']
const AUDIENCE_TYPES = [
  { value: 'cold', label: 'Cold Audience (never interacted)' },
  { value: 'warm', label: 'Warm Audience (website visitors, engagement)' },
  { value: 'hot', label: 'Hot Audience (cart abandoners, past customers)' },
  { value: 'lookalike', label: 'Lookalike / Similar Audiences' },
]

interface Props {
  data: {
    target_audience: TargetAudienceType
    audience_type: string[]
  }
  onChange: (data: { target_audience?: TargetAudienceType; audience_type?: string[] }) => void
}

export default function TargetAudience({ data, onChange }: Props) {
  const demo = data.target_audience.demographics || {}
  const psycho = data.target_audience.psychographics || {}

  const updateDemo = (update: Partial<NonNullable<TargetAudienceType['demographics']>>) => {
    onChange({
      target_audience: {
        ...data.target_audience,
        demographics: { ...demo, ...update },
      },
    })
  }

  const updatePsycho = (update: Partial<NonNullable<TargetAudienceType['psychographics']>>) => {
    onChange({
      target_audience: {
        ...data.target_audience,
        psychographics: { ...psycho, ...update },
      },
    })
  }

  const toggleArrayItem = (
    arr: string[] | undefined,
    item: string,
    setter: (items: string[]) => void
  ) => {
    const current = arr || []
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item]
    setter(updated)
  }

  const toggleAudienceType = (type: string) => {
    const current = data.audience_type
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onChange({ audience_type: updated })
  }

  return (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Demographics</h4>

        <div className="space-y-2">
          <Label>Age Range</Label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map((range) => (
              <label key={range} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(demo.age_range || []).includes(range)}
                  onChange={() => toggleArrayItem(demo.age_range, range, (v) => updateDemo({ age_range: v }))}
                  className="rounded border-gray-300"
                />
                {range}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={demo.gender || ''} onValueChange={(v) => updateDemo({ gender: v as 'male' | 'female' | 'all' })}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location Type</Label>
            <Select value={demo.location_type || ''} onValueChange={(v) => updateDemo({ location_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select location type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="national">National</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="locations">Specific Locations</Label>
            <Input
              id="locations"
              placeholder="e.g. New York, California"
              value={(demo.locations || []).join(', ')}
              onChange={(e) => updateDemo({ locations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Income Level</Label>
            <Select value={demo.income_level || ''} onValueChange={(v) => updateDemo({ income_level: v })}>
              <SelectTrigger><SelectValue placeholder="Select income level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="<30k">Under $30k</SelectItem>
                <SelectItem value="30-50k">$30k - $50k</SelectItem>
                <SelectItem value="50-75k">$50k - $75k</SelectItem>
                <SelectItem value="75-100k">$75k - $100k</SelectItem>
                <SelectItem value="100k+">$100k+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Psychographics */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Psychographics</h4>

        <div className="space-y-2">
          <Label>Interests / Hobbies</Label>
          <div className="grid grid-cols-3 gap-2">
            {INTERESTS.map((interest) => (
              <label key={interest} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(psycho.interests || []).includes(interest)}
                  onChange={() => toggleArrayItem(psycho.interests, interest, (v) => updatePsycho({ interests: v }))}
                  className="rounded border-gray-300"
                />
                {interest}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Behaviors</Label>
          <div className="grid grid-cols-2 gap-2">
            {BEHAVIORS.map((behavior) => (
              <label key={behavior} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(psycho.behaviors || []).includes(behavior)}
                  onChange={() => toggleArrayItem(psycho.behaviors, behavior, (v) => updatePsycho({ behaviors: v }))}
                  className="rounded border-gray-300"
                />
                {behavior}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Life Events (optional)</Label>
          <div className="grid grid-cols-3 gap-2">
            {LIFE_EVENTS.map((event) => (
              <label key={event} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(psycho.life_events || []).includes(event)}
                  onChange={() => toggleArrayItem(psycho.life_events, event, (v) => updatePsycho({ life_events: v }))}
                  className="rounded border-gray-300"
                />
                {event}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Type */}
      <div className="space-y-2">
        <Label>Audience Type</Label>
        <div className="space-y-2">
          {AUDIENCE_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={data.audience_type.includes(value)}
                onChange={() => toggleAudienceType(value)}
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience_size">Audience Size Estimate</Label>
        <Input
          id="audience_size"
          type="number"
          min={0}
          placeholder="Estimated audience size"
          value={data.target_audience.audience_size_estimate || ''}
          onChange={(e) =>
            onChange({
              target_audience: {
                ...data.target_audience,
                audience_size_estimate: e.target.value ? Number(e.target.value) : undefined,
              },
            })
          }
        />
      </div>
    </div>
  )
}
