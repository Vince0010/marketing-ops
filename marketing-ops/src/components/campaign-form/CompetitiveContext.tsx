import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CompetitiveContext as CompetitiveContextType } from '@/types/campaign'

interface Props {
  data: CompetitiveContextType
  onChange: (data: CompetitiveContextType) => void
}

export default function CompetitiveContext({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Competitive Landscape</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Market Saturation</Label>
            <Select
              value={data.market_saturation || ''}
              onValueChange={(v) => onChange({ ...data, market_saturation: v as CompetitiveContextType['market_saturation'] })}
            >
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="competitor_count">Number of Direct Competitors</Label>
            <Input
              id="competitor_count"
              type="number"
              min={0}
              placeholder="e.g. 5"
              value={data.competitor_count || ''}
              onChange={(e) => onChange({ ...data, competitor_count: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advantage">Competitive Advantage</Label>
            <Input
              id="advantage"
              placeholder="e.g. Lowest price, best quality"
              value={data.competitive_advantage || ''}
              onChange={(e) => onChange({ ...data, competitive_advantage: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Price Position</Label>
            <Select
              value={data.price_position || ''}
              onValueChange={(v) => onChange({ ...data, price_position: v as CompetitiveContextType['price_position'] })}
            >
              <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="mid_range">Mid-Range</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Market Timing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Seasonality Factor</Label>
            <Select
              value={data.seasonality || ''}
              onValueChange={(v) => onChange({ ...data, seasonality: v as CompetitiveContextType['seasonality'] })}
            >
              <SelectTrigger><SelectValue placeholder="Select seasonality" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="peak">Peak Season</SelectItem>
                <SelectItem value="off_peak">Off-Peak</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Market Trends</Label>
            <Select
              value={data.market_trends || ''}
              onValueChange={(v) => onChange({ ...data, market_trends: v as CompetitiveContextType['market_trends'] })}
            >
              <SelectTrigger><SelectValue placeholder="Select trend" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="declining">Declining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="events">Relevant Events / Holidays</Label>
          <Input
            id="events"
            placeholder="e.g. Black Friday, Back to School"
            value={data.relevant_events || ''}
            onChange={(e) => onChange({ ...data, relevant_events: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
