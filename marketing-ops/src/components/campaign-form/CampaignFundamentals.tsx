import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ChoiceCards } from '@/components/ui/choice-cards'
import type { CampaignType } from '@/types/campaign'

const CAMPAIGN_TYPES: { value: CampaignType; label: string; description?: string }[] = [
  { value: 'new_product_launch', label: 'New Product Launch', description: 'Launching a new product or service' },
  { value: 'seasonal_promo', label: 'Seasonal Promotion', description: 'Time-bound sales or seasonal campaigns' },
  { value: 'brand_awareness', label: 'Brand Awareness', description: 'Reach and recognition' },
  { value: 'lead_gen', label: 'Lead Generation', description: 'Capture leads and sign-ups' },
  { value: 'retargeting', label: 'Retargeting', description: 'Re-engage past visitors or customers' },
  { value: 'event_based', label: 'Event-Based', description: 'Tied to an event or milestone' },
]

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
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="Enter campaign name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Campaign Type *</Label>
        <ChoiceCards
          value={data.campaign_type}
          options={CAMPAIGN_TYPES}
          onChange={(v) => onChange({ campaign_type: v })}
          columns={3}
        />
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

      <Accordion type="single" collapsible value={detailsOpen ? 'details' : ''} onValueChange={(v) => setDetailsOpen(v === 'details')}>
        <AccordionItem value="details" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline hover:text-foreground">
            More details (industry, description)
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry / Vertical</Label>
              <Input
                id="industry"
                placeholder="e.g. Healthcare, SaaS, E-commerce"
                value={data.industry}
                onChange={(e) => onChange({ industry: e.target.value })}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
