import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Rocket,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Check,
  Calendar,
  DollarSign,
  Target,
  ListChecks,
} from 'lucide-react'
import { CAMPAIGN_TYPES, CAMPAIGN_OBJECTIVES, PRIMARY_KPIS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { PhaseType } from '@/types/phase'

interface PhaseInput {
  id: string
  phase_name: string
  phase_type: PhaseType
  planned_duration_days: number
  owner: string
}

const PHASE_TYPES: { value: PhaseType; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'creative', label: 'Creative' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'setup', label: 'Setup' },
  { value: 'launch', label: 'Launch' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'reporting', label: 'Reporting' },
]

const TEAM_MEMBERS = [
  'Sarah Johnson',
  'Mike Chen',
  'Emily Davis',
  'Tom Wilson',
]

const STEPS = [
  { label: 'Details', icon: <Rocket className="w-4 h-4" /> },
  { label: 'Budget & Timeline', icon: <DollarSign className="w-4 h-4" /> },
  { label: 'Phases', icon: <ListChecks className="w-4 h-4" /> },
  { label: 'Review', icon: <Check className="w-4 h-4" /> },
]

export default function CampaignCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Campaign Details
  const [name, setName] = useState('')
  const [campaignType, setCampaignType] = useState('')
  const [objective, setObjective] = useState('')
  const [primaryKpi, setPrimaryKpi] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [description, setDescription] = useState('')

  // Step 2: Budget & Timeline
  const [totalBudget, setTotalBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Step 3: Phases
  const [phases, setPhases] = useState<PhaseInput[]>([
    { id: crypto.randomUUID(), phase_name: 'Planning & Strategy', phase_type: 'planning', planned_duration_days: 3, owner: 'Sarah Johnson' },
    { id: crypto.randomUUID(), phase_name: 'Creative Development', phase_type: 'creative', planned_duration_days: 5, owner: 'Mike Chen' },
    { id: crypto.randomUUID(), phase_name: 'Campaign Setup', phase_type: 'setup', planned_duration_days: 2, owner: 'Emily Davis' },
    { id: crypto.randomUUID(), phase_name: 'Launch & Monitor', phase_type: 'launch', planned_duration_days: 1, owner: 'Sarah Johnson' },
    { id: crypto.randomUUID(), phase_name: 'Optimization', phase_type: 'optimization', planned_duration_days: 7, owner: 'Tom Wilson' },
  ])

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        id: crypto.randomUUID(),
        phase_name: '',
        phase_type: 'planning',
        planned_duration_days: 3,
        owner: '',
      },
    ])
  }

  const removePhase = (id: string) => {
    if (phases.length <= 1) return
    setPhases(phases.filter((p) => p.id !== id))
  }

  const updatePhase = (id: string, field: keyof PhaseInput, value: string | number) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const totalPhaseDays = phases.reduce((acc, p) => acc + p.planned_duration_days, 0)

  const canNext = () => {
    if (step === 0) return name && campaignType && objective && primaryKpi
    if (step === 1) return totalBudget && startDate && endDate
    if (step === 2) return phases.length > 0 && phases.every((p) => p.phase_name && p.owner)
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          campaign_type: campaignType,
          primary_objective: objective,
          primary_kpi: primaryKpi,
          target_value: parseFloat(targetValue) || 0,
          total_budget: parseFloat(totalBudget) || 0,
          start_date: startDate,
          end_date: endDate,
          status: 'planning',
        })
        .select()
        .single()

      if (error) throw error

      // Insert phases
      if (data) {
        let cumulativeDays = 0
        const phaseInserts = phases.map((p, i) => {
          const phaseStart = new Date(startDate)
          phaseStart.setDate(phaseStart.getDate() + cumulativeDays)
          const phaseEnd = new Date(phaseStart)
          phaseEnd.setDate(phaseEnd.getDate() + p.planned_duration_days)
          cumulativeDays += p.planned_duration_days

          return {
            campaign_id: data.id,
            phase_number: i + 1,
            phase_name: p.phase_name,
            phase_type: p.phase_type,
            planned_start_date: phaseStart.toISOString().split('T')[0],
            planned_end_date: phaseEnd.toISOString().split('T')[0],
            planned_duration_days: p.planned_duration_days,
            status: 'pending' as const,
            drift_days: 0,
            owner: p.owner,
          }
        })

        await supabase.from('execution_phases').insert(phaseInserts)
      }

      navigate(`/campaigns/${data.id}/validate`)
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">Plan your marketing campaign with AI-powered insights</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === step
                  ? 'bg-blue-100 text-blue-700'
                  : i < step
                  ? 'text-green-600 cursor-pointer hover:bg-green-50'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step
                    ? 'bg-blue-600 text-white'
                    : i < step
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Campaign Details */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Campaign Details
            </CardTitle>
            <CardDescription>Enter the basic information for your marketing campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Sale 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type *</Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Objective *</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OBJECTIVES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary KPI *</Label>
                <Select value={primaryKpi} onValueChange={setPrimaryKpi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select KPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_KPIS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="e.g. 3.5 for ROAS"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign goals and strategy"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Budget & Timeline */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget & Timeline
            </CardTitle>
            <CardDescription>Set budget allocation and campaign dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget (USD) *</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  className="pl-9"
                  placeholder="50000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                />
              </div>
              {totalBudget && (
                <p className="text-sm text-muted-foreground">
                  Daily budget estimate: ${(parseFloat(totalBudget) / 30).toFixed(0)}/day (over 30 days)
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date *
                </Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date *
                </Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Campaign Duration:{' '}
                  {Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Phase Timeline Planner */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Phase Timeline Planner
                </CardTitle>
                <CardDescription>
                  Define execution phases. Total: {totalPhaseDays} days across {phases.length} phases
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addPhase} className="gap-1">
                <Plus className="w-4 h-4" /> Add Phase
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual timeline bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              {phases.map((phase, i) => {
                const colors = [
                  'bg-blue-500',
                  'bg-purple-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-indigo-500',
                  'bg-pink-500',
                ]
                const widthPercent = totalPhaseDays > 0 ? (phase.planned_duration_days / totalPhaseDays) * 100 : 0
                return (
                  <div
                    key={phase.id}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${phase.phase_name}: ${phase.planned_duration_days} days`}
                  />
                )
              })}
            </div>

            <Separator />

            {/* Phase list */}
            <div className="space-y-3">
              {phases.map((phase, i) => (
                <div key={phase.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Phase {i + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      onClick={() => removePhase(phase.id)}
                      disabled={phases.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Phase Name *</Label>
                      <Input
                        placeholder="e.g. Creative Development"
                        value={phase.phase_name}
                        onChange={(e) => updatePhase(phase.id, 'phase_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={phase.phase_type}
                        onValueChange={(v) => updatePhase(phase.id, 'phase_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Owner *</Label>
                      <Select
                        value={phase.owner}
                        onValueChange={(v) => updatePhase(phase.id, 'owner', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_MEMBERS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label className="text-xs">Duration</Label>
                      <span className="text-xs font-semibold">{phase.planned_duration_days} days</span>
                    </div>
                    <Slider
                      value={[phase.planned_duration_days]}
                      onValueChange={([v]) => updatePhase(phase.id, 'planned_duration_days', v)}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Review Campaign
            </CardTitle>
            <CardDescription>Verify all details before creating the campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Campaign Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{campaignType.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Objective</span>
                    <span className="font-medium">{objective}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KPI</span>
                    <Badge variant="outline">{primaryKpi}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Budget & Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">${parseFloat(totalBudget || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start</span>
                    <span className="font-medium">{startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End</span>
                    <span className="font-medium">{endDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Phase Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Execution Phases ({phases.length} phases, {totalPhaseDays} total days)
              </h3>
              <div className="space-y-2">
                {phases.map((phase, i) => (
                  <div key={phase.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        P{i + 1}
                      </Badge>
                      <span className="text-sm font-medium">{phase.phase_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{phase.owner}</span>
                      <Badge variant="outline">{phase.planned_duration_days}d</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Create Campaign
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
