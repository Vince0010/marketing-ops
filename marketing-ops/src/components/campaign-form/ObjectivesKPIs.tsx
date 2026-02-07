import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PrimaryObjective, PrimaryKPI } from '@/types/campaign'

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
  const toggleSecondaryKpi = (kpi: string) => {
    const current = data.secondary_kpis
    const updated = current.includes(kpi)
      ? current.filter((k) => k !== kpi)
      : [...current, kpi]
    onChange({ secondary_kpis: updated })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Objective *</Label>
          <Select
            value={data.primary_objective}
            onValueChange={(v) => onChange({ primary_objective: v as PrimaryObjective })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales (Direct Revenue)</SelectItem>
              <SelectItem value="lead_gen">Lead Generation</SelectItem>
              <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="traffic">Traffic</SelectItem>
              <SelectItem value="app_installs">App Installs</SelectItem>
              <SelectItem value="store_visits">Store Visits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Primary KPI *</Label>
          <Select
            value={data.primary_kpi}
            onValueChange={(v) => onChange({ primary_kpi: v as PrimaryKPI })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select KPI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ROAS">ROAS (Return on Ad Spend)</SelectItem>
              <SelectItem value="CPA">CPA (Cost Per Acquisition)</SelectItem>
              <SelectItem value="CPL">CPL (Cost Per Lead)</SelectItem>
              <SelectItem value="CTR">CTR (Click-Through Rate)</SelectItem>
              <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
              <SelectItem value="reach">Reach</SelectItem>
              <SelectItem value="video_views">Video Views</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_value">Target Value *</Label>
        <Input
          id="target_value"
          type="number"
          min={0}
          step="0.01"
          placeholder="Enter target value for your primary KPI"
          value={data.target_value}
          onChange={(e) => onChange({ target_value: e.target.value ? Number(e.target.value) : '' })}
        />
      </div>

      <div className="space-y-2">
        <Label>Secondary KPIs (optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          {SECONDARY_KPIS.map((kpi) => (
            <label key={kpi} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={data.secondary_kpis.includes(kpi)}
                onChange={() => toggleSecondaryKpi(kpi)}
                className="rounded border-gray-300"
              />
              {kpi}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
