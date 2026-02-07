import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CampaignType } from '@/types/campaign'

interface CampaignFundamentalsData {
  name: string
  campaign_type?: CampaignType
  start_date: string
  end_date: string
  total_budget: number | ''
  industry: string
  description: string
}

interface Props {
  data: CampaignFundamentalsData
  onChange: (data: Partial<CampaignFundamentalsData>) => void
}

export default function CampaignFundamentals({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="Enter campaign name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Campaign Type *</Label>
          <Select
            value={data.campaign_type}
            onValueChange={(v) => onChange({ campaign_type: v as CampaignType })}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new_product_launch">New Product Launch</SelectItem>
              <SelectItem value="seasonal_promo">Seasonal Promotion</SelectItem>
              <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
              <SelectItem value="lead_gen">Lead Generation</SelectItem>
              <SelectItem value="retargeting">Retargeting</SelectItem>
              <SelectItem value="event_based">Event-Based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry / Vertical</Label>
          <Input
            id="industry"
            placeholder="e.g. Healthcare, SaaS, E-commerce"
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={data.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={data.end_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_budget">Total Budget ($) *</Label>
        <Input
          id="total_budget"
          type="number"
          min={0}
          placeholder="Enter total budget"
          value={data.total_budget}
          onChange={(e) => onChange({ total_budget: e.target.value ? Number(e.target.value) : '' })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your campaign goals and strategy"
          rows={3}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  )
}
