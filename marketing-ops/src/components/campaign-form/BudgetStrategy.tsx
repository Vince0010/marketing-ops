import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { BudgetStrategy as BudgetStrategyType } from '@/types/campaign'

interface Props {
  data: BudgetStrategyType & { daily_budget: number | '' }
  onChange: (data: Partial<BudgetStrategyType & { daily_budget: number | '' }>) => void
}

export default function BudgetStrategy({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="daily_budget">Daily Budget ($)</Label>
          <Input
            id="daily_budget"
            type="number"
            min={0}
            placeholder="Daily budget"
            value={data.daily_budget}
            onChange={(e) => onChange({ daily_budget: e.target.value ? Number(e.target.value) : '' })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lifetime_budget">Lifetime Budget ($)</Label>
          <Input
            id="lifetime_budget"
            type="number"
            min={0}
            placeholder="Lifetime budget"
            value={data.lifetime_budget || ''}
            onChange={(e) => onChange({ lifetime_budget: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bidding Strategy</Label>
        <Select
          value={data.bidding_strategy || ''}
          onValueChange={(v) => onChange({ bidding_strategy: v as BudgetStrategyType['bidding_strategy'] })}
        >
          <SelectTrigger><SelectValue placeholder="Select bidding strategy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="lowest_cost">Lowest Cost (automatic)</SelectItem>
            <SelectItem value="cost_cap">Cost Cap</SelectItem>
            <SelectItem value="bid_cap">Bid Cap</SelectItem>
            <SelectItem value="roas_goal">ROAS Goal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.bidding_strategy === 'cost_cap' || data.bidding_strategy === 'bid_cap' || data.bidding_strategy === 'roas_goal') && (
        <div className="space-y-2">
          <Label htmlFor="bidding_target">
            {data.bidding_strategy === 'roas_goal' ? 'Target ROAS' : data.bidding_strategy === 'cost_cap' ? 'Target CPA ($)' : 'Max Bid ($)'}
          </Label>
          <Input
            id="bidding_target"
            type="number"
            min={0}
            step="0.01"
            value={data.bidding_target || ''}
            onChange={(e) => onChange({ bidding_target: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      )}

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="allocation" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            Phase allocation (testing vs scaling %)
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="testing_percent">Testing Phase Budget (%)</Label>
              <Input
                id="testing_percent"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 30"
                value={data.testing_phase_percent || ''}
                onChange={(e) => onChange({ testing_phase_percent: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scaling_percent">Scaling Phase Budget (%)</Label>
              <Input
                id="scaling_percent"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 70"
                value={data.scaling_phase_percent || ''}
                onChange={(e) => onChange({ scaling_phase_percent: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="benchmarks" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            Expected performance benchmarks (optional)
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_ctr">Expected CTR (%)</Label>
                <Input
                  id="expected_ctr"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 2.5"
                  value={data.expected_ctr || ''}
                  onChange={(e) => onChange({ expected_ctr: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_cpc">Expected CPC ($)</Label>
                <Input
                  id="expected_cpc"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 1.50"
                  value={data.expected_cpc || ''}
                  onChange={(e) => onChange({ expected_cpc: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_conv">Expected Conversion Rate (%)</Label>
                <Input
                  id="expected_conv"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 3.0"
                  value={data.expected_conversion_rate || ''}
                  onChange={(e) => onChange({ expected_conversion_rate: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_cpa">Expected CPA ($)</Label>
                <Input
                  id="expected_cpa"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 25.00"
                  value={data.expected_cpa || ''}
                  onChange={(e) => onChange({ expected_cpa: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
