import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Constraints } from '@/types/campaign'

const KNOWN_CONSTRAINTS = [
  'Compressed timeline',
  'Limited budget vs. typical',
  'First campaign for this client/product',
  'Regulatory restrictions',
  'Seasonal timing (holiday, event-based)',
  'Competitive market period',
]

const RESOURCE_CONSTRAINTS = [
  'Limited creative resources',
  'New team member leading',
  'Outsourced creative production',
  'Client approval bottleneck',
]

interface Props {
  data: Constraints
  onChange: (data: Constraints) => void
}

export default function ConstraintsRisks({ data, onChange }: Props) {
  const toggleItem = (key: 'known_constraints' | 'resource_constraints', item: string) => {
    const current = data[key] || []
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item]
    onChange({ ...data, [key]: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Known Constraints</Label>
        <div className="space-y-2">
          {KNOWN_CONSTRAINTS.map((constraint) => (
            <label key={constraint} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.known_constraints || []).includes(constraint)}
                onChange={() => toggleItem('known_constraints', constraint)}
                className="rounded border-gray-300"
              />
              {constraint}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Resource Constraints</Label>
        <div className="space-y-2">
          {RESOURCE_CONSTRAINTS.map((constraint) => (
            <label key={constraint} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(data.resource_constraints || []).includes(constraint)}
                onChange={() => toggleItem('resource_constraints', constraint)}
                className="rounded border-gray-300"
              />
              {constraint}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Historical Context</h4>

        <div className="space-y-2">
          <Label htmlFor="similar_campaigns">Similar Past Campaigns</Label>
          <Input
            id="similar_campaigns"
            placeholder="Select from list or 'First time'"
            value={data.similar_past_campaigns || ''}
            onChange={(e) => onChange({ ...data, similar_past_campaigns: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hist_ctr">Avg Past CTR (%)</Label>
            <Input
              id="hist_ctr"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 2.1"
              value={data.historical_ctr || ''}
              onChange={(e) => onChange({ ...data, historical_ctr: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hist_cpa">Avg Past CPA ($)</Label>
            <Input
              id="hist_cpa"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 22.50"
              value={data.historical_cpa || ''}
              onChange={(e) => onChange({ ...data, historical_cpa: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hist_roas">Avg Past ROAS</Label>
            <Input
              id="hist_roas"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 3.5"
              value={data.historical_roas || ''}
              onChange={(e) => onChange({ ...data, historical_roas: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
