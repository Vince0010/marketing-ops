import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ChoiceCards } from '@/components/ui/choice-cards'
import type { PrimaryObjective, PrimaryKPI } from '@/types/campaign'

const OBJECTIVES: { value: PrimaryObjective; label: string }[] = [
  { value: 'sales', label: 'Sales (Direct Revenue)' },
  { value: 'lead_gen', label: 'Lead Generation' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'app_installs', label: 'App Installs' },
  { value: 'store_visits', label: 'Store Visits' },
]

const KPI_OPTIONS: { value: PrimaryKPI; label: string; objectives?: PrimaryObjective[] }[] = [
  { value: 'ROAS', label: 'ROAS (Return on Ad Spend)', objectives: ['sales'] },
  { value: 'CPA', label: 'CPA (Cost Per Acquisition)', objectives: ['sales', 'lead_gen', 'app_installs'] },
  { value: 'CPL', label: 'CPL (Cost Per Lead)', objectives: ['lead_gen'] },
  { value: 'CTR', label: 'CTR (Click-Through Rate)', objectives: ['traffic', 'engagement'] },
  { value: 'engagement_rate', label: 'Engagement Rate', objectives: ['engagement', 'brand_awareness'] },
  { value: 'reach', label: 'Reach', objectives: ['brand_awareness'] },
  { value: 'video_views', label: 'Video Views', objectives: ['brand_awareness', 'engagement'] },
]

const SECONDARY_KPIS = ['ROAS', 'CPA', 'CPL', 'CTR', 'Engagement Rate', 'Reach', 'Video Views']

interface ObjectivesKPIsData {
  primary_objective?: PrimaryObjective
  primary_kpi?: PrimaryKPI
  target_value: number | ''
  secondary_kpis: string[]
}

interface Props {
  data: ObjectivesKPIsData
  onChange: (data: Partial<ObjectivesKPIsData>) => void
}

export default function ObjectivesKPIs({ data, onChange }: Props) {
  const [secondaryOpen, setSecondaryOpen] = useState(false)

  const suggestedKpis = (() => {
    if (!data.primary_objective) return KPI_OPTIONS
    const filtered = KPI_OPTIONS.filter(
      (k) => !k.objectives || k.objectives.includes(data.primary_objective!)
    )
    return filtered.length > 0 ? filtered : KPI_OPTIONS
  })()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>What’s your main goal? *</Label>
        <ChoiceCards
          value={data.primary_objective}
          options={OBJECTIVES}
          onChange={(v) => onChange({ primary_objective: v, primary_kpi: undefined })}
          columns={3}
        />
      </div>

      {data.primary_objective && (
        <div className="space-y-2">
          <Label>How will you measure success? *</Label>
          <ChoiceCards
            value={data.primary_kpi}
            options={suggestedKpis.map((k) => ({ value: k.value, label: k.label }))}
            onChange={(v) => onChange({ primary_kpi: v as PrimaryKPI })}
            columns={3}
          />
        </div>
      )}

      {data.primary_kpi && (
        <div className="space-y-2">
          <Label htmlFor="target_value">Target value for your primary KPI *</Label>
          <Input
            id="target_value"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 2.5 for ROAS, 50 for CPA"
            value={data.target_value}
            onChange={(e) => onChange({ target_value: e.target.value ? Number(e.target.value) : '' })}
          />
        </div>
      )}

      <Accordion type="single" collapsible value={secondaryOpen ? 'secondary' : ''} onValueChange={(v) => setSecondaryOpen(v === 'secondary')}>
        <AccordionItem value="secondary" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline hover:text-foreground">
            Secondary metrics (optional)
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_KPIS.map((kpi) => (
                <label key={kpi} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.secondary_kpis.includes(kpi)}
                    onChange={() => {
                      const current = data.secondary_kpis
                      const updated = current.includes(kpi)
                        ? current.filter((k) => k !== kpi)
                        : [...current, kpi]
                      onChange({ secondary_kpis: updated })
                    }}
                    className="rounded border-input"
                  />
                  {kpi}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
