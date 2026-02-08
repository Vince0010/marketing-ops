import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Rocket, Target, Users, Palette, Share2, DollarSign,
  ListChecks, AlertTriangle, BarChart3, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createDefaultStages } from '@/lib/defaultStages'
import { stagesToPhaseInserts } from '@/lib/stageUtils'
import { SIMULATE_CAMPAIGN_ID, saveSimulatePayload } from '@/lib/simulate'
import type { StageConfig } from '@/types/phase'
import type { AdDeliverable } from '@/types/adDeliverable'
import type {
  CampaignType, PrimaryObjective, PrimaryKPI,
  TargetAudience as TargetAudienceType, CreativeStrategy as CreativeStrategyType,
  ChannelPlacement as ChannelPlacementType, BudgetStrategy as BudgetStrategyType,
  TrackingSetup as TrackingSetupType, CompetitiveContext as CompetitiveContextType,
  Constraints,
} from '@/types/campaign'

import CampaignFundamentals from '@/components/campaign-form/CampaignFundamentals'
import ObjectivesKPIs from '@/components/campaign-form/ObjectivesKPIs'
import TargetAudience from '@/components/campaign-form/TargetAudience'
import CreativeStrategy from '@/components/campaign-form/CreativeStrategy'
import ChannelPlacement from '@/components/campaign-form/ChannelPlacement'
import BudgetStrategyComponent from '@/components/campaign-form/BudgetStrategy'
import ConstraintsRisks from '@/components/campaign-form/ConstraintsRisks'
import TrackingSetup from '@/components/campaign-form/TrackingSetup'
import CompetitiveContext from '@/components/campaign-form/CompetitiveContext'
import StageBuilder from '@/components/stages/StageBuilder'
import AdDeliverablesEditor from '@/components/campaign-form/AdDeliverablesEditor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText } from 'lucide-react'

interface FormData {
  // Fundamentals
  name: string
  campaign_type?: CampaignType
  start_date: string
  end_date: string
  total_budget: number | ''
  industry: string
  description: string
  // Objectives
  primary_objective?: PrimaryObjective
  primary_kpi?: PrimaryKPI
  target_value: number | ''
  secondary_kpis: string[]
  // Audience
  target_audience: TargetAudienceType
  audience_type: string[]
  // Creative
  creative_strategy: CreativeStrategyType
  // Channels
  channel_placement: ChannelPlacementType
  // Budget
  daily_budget: number | ''
  budget_strategy: BudgetStrategyType
  // Tracking
  meta_pixel_id: string
  meta_ads_account_id: string
  tracking_setup: TrackingSetupType
  // Competitive
  competitive_context: CompetitiveContextType
  // Constraints
  constraints: Constraints
}

const INITIAL_FORM: FormData = {
  name: '',
  campaign_type: undefined,
  start_date: '',
  end_date: '',
  total_budget: '',
  industry: '',
  description: '',
  primary_objective: undefined,
  primary_kpi: undefined,
  target_value: '',
  secondary_kpis: [],
  target_audience: {},
  audience_type: [],
  creative_strategy: {},
  channel_placement: {},
  daily_budget: '',
  budget_strategy: {},
  meta_pixel_id: '',
  meta_ads_account_id: '',
  tracking_setup: {},
  competitive_context: {},
  constraints: {},
}

interface Section {
  id: string
  title: string
  icon: React.ElementType
  required?: boolean
}

const SECTIONS: Section[] = [
  { id: 'fundamentals', title: 'Campaign Fundamentals', icon: Rocket, required: true },
  { id: 'objectives', title: 'Objectives & KPIs', icon: Target, required: true },
  { id: 'audience', title: 'Target Audience', icon: Users },
  { id: 'creative', title: 'Creative Strategy', icon: Palette },
  { id: 'channels', title: 'Channel & Placement', icon: Share2 },
  { id: 'budget', title: 'Budget Strategy', icon: DollarSign },
  { id: 'stages', title: 'Execution Stages', icon: ListChecks, required: true },
  { id: 'constraints', title: 'Constraints & Risk Factors', icon: AlertTriangle },
  { id: 'tracking', title: 'Tracking & Measurement', icon: BarChart3 },
  { id: 'competitive', title: 'Competitive & Market Context', icon: Globe },
]

const TOTAL_STEPS = SECTIONS.length

export default function CampaignCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const templateFrom = location.state?.template as { name: string; description: string; sourcePhaseName?: string } | undefined
  const [form, setForm] = useState<FormData>(() => {
    const base = INITIAL_FORM
    if (location.state?.template) {
      const t = location.state.template as { name: string; description: string }
      return {
        ...base,
        name: `Campaign from: ${t.name}`,
        description: t.description || '',
      }
    }
    return base
  })
  const [stages, setStages] = useState<StageConfig[]>(createDefaultStages())
  const [adDeliverables, setAdDeliverables] = useState<AdDeliverable[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const section = SECTIONS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOTAL_STEPS - 1

  const goNext = () => {
    setError(null)
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep((s) => s + 1)
  }

  const goBack = () => {
    setError(null)
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const canSubmit = form.name && form.campaign_type && form.start_date && form.end_date &&
    form.total_budget && form.primary_objective && form.primary_kpi && form.target_value &&
    stages.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    try {
      const { data: campaign, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          name: form.name,
          campaign_type: form.campaign_type!,
          status: 'planning',
          description: form.description || null,
          industry: form.industry || null,
          start_date: form.start_date,
          end_date: form.end_date,
          total_budget: Number(form.total_budget),
          daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
          primary_objective: form.primary_objective!,
          primary_kpi: form.primary_kpi!,
          target_value: Number(form.target_value),
          secondary_kpis: form.secondary_kpis.length ? form.secondary_kpis : null,
          target_audience: Object.keys(form.target_audience).length ? form.target_audience : null,
          audience_type: form.audience_type.length ? form.audience_type : null,
          creative_strategy: Object.keys(form.creative_strategy).length ? form.creative_strategy : null,
          channel_placement: Object.keys(form.channel_placement).length ? form.channel_placement : null,
          budget_strategy: Object.keys(form.budget_strategy).length ? form.budget_strategy : null,
          tracking_setup: Object.keys(form.tracking_setup).length ? form.tracking_setup : null,
          meta_pixel_id: form.meta_pixel_id || null,
          meta_ads_account_id: form.meta_ads_account_id || null,
          competitive_context: Object.keys(form.competitive_context).length ? form.competitive_context : null,
          constraints: Object.keys(form.constraints).length ? form.constraints : null,
          operational_health: 100,
          performance_health: 100,
          drift_count: 0,
          positive_drift_count: 0,
          negative_drift_count: 0,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      const phaseInserts = stagesToPhaseInserts(stages, campaign.id, form.start_date)
      const { data: createdPhases, error: phasesError } = await supabase
        .from('execution_phases')
        .insert(phaseInserts)
        .select('id, phase_name, phase_number, planned_duration_days')

      if (phasesError) throw phasesError

      // Build planned timeline map for action cards
      // Each phase gets 8-hour workdays (480 minutes per day)
      const plannedTimelineMap: Record<string, { phase_name: string; planned_minutes: number; phase_number: number }> = {}
      if (createdPhases) {
        createdPhases.forEach(phase => {
          plannedTimelineMap[phase.id] = {
            phase_name: phase.phase_name,
            planned_minutes: phase.planned_duration_days * 8 * 60, // 8 hours/day * 60 min/hour
            phase_number: phase.phase_number
          }
        })
      }

      // Create ad deliverable tasks in Kanban backlog via backend API
      if (adDeliverables.length > 0) {
        console.log(`[CampaignCreate] Creating ${adDeliverables.length} ad deliverable tasks...`)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const now = new Date().toISOString()

        const results = await Promise.allSettled(
          adDeliverables.map(async (ad) => {
            const taskData = {
              title: ad.title.trim() || `${ad.platform} ${ad.post_type}`,
              description: ad.description.trim() || null,
              action_type: 'Ad Deliverable',
              status: 'planned',
              priority: 'medium',
              phase_id: null,
              timestamp: now,
              metadata: { platform: ad.platform, post_type: ad.post_type },
              planned_timeline: plannedTimelineMap, // Add the planned timeline map
            }
            console.log('[CampaignCreate] Creating task:', taskData.title, 'for campaign:', campaign.id)
            
            const response = await fetch(`${apiUrl}/campaigns/${campaign.id}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData),
            })
            
            if (!response.ok) {
              const errorText = await response.text()
              console.error('[CampaignCreate] Failed to create task:', response.status, errorText)
              throw new Error(`Failed to create task: ${response.status} - ${errorText}`)
            }
            
            const createdTask = await response.json()
            console.log('[CampaignCreate] Task created successfully:', createdTask.id)
            return createdTask
          })
        )

        const failures = results.filter((r) => r.status === 'rejected')
        const successes = results.filter((r) => r.status === 'fulfilled')
        
        console.log(`[CampaignCreate] Created ${successes.length} tasks successfully, ${failures.length} failed`)
        
        if (failures.length > 0) {
          console.error('[CampaignCreate] Failed to create some ad deliverable tasks:', failures)
        }
      }

      navigate(`/campaigns/${campaign.id}/validate`)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string') {
        setError((err as { message: string }).message)
      } else {
        setError('Failed to create campaign')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /** Create campaign in memory and go to validate — no Supabase. Use while DB is not ready. */
  const handleSimulate = () => {
    if (!canSubmit) return
    setError(null)
    const now = new Date().toISOString()
    const campaign = {
      id: SIMULATE_CAMPAIGN_ID,
      created_at: now,
      name: form.name,
      campaign_type: form.campaign_type!,
      status: 'planning',
      description: form.description || null,
      industry: form.industry || null,
      start_date: form.start_date,
      end_date: form.end_date,
      total_budget: Number(form.total_budget),
      daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
      primary_objective: form.primary_objective!,
      primary_kpi: form.primary_kpi!,
      target_value: Number(form.target_value),
      secondary_kpis: form.secondary_kpis.length ? form.secondary_kpis : null,
      target_audience: Object.keys(form.target_audience).length ? form.target_audience : null,
      audience_type: form.audience_type.length ? form.audience_type : null,
      creative_strategy: Object.keys(form.creative_strategy).length ? form.creative_strategy : null,
      channel_placement: Object.keys(form.channel_placement).length ? form.channel_placement : null,
      budget_strategy: Object.keys(form.budget_strategy).length ? form.budget_strategy : null,
      tracking_setup: Object.keys(form.tracking_setup).length ? form.tracking_setup : null,
      meta_pixel_id: form.meta_pixel_id || null,
      meta_ads_account_id: form.meta_ads_account_id || null,
      competitive_context: Object.keys(form.competitive_context).length ? form.competitive_context : null,
      constraints: Object.keys(form.constraints).length ? form.constraints : null,
      operational_health: 100,
      performance_health: 100,
      drift_count: 0,
      positive_drift_count: 0,
      negative_drift_count: 0,
      risk_score: 75,
    }
    const phaseInserts = stagesToPhaseInserts(stages, SIMULATE_CAMPAIGN_ID, form.start_date)
    const phases = phaseInserts.map((p, i) => ({
      ...p,
      id: `simulate-phase-${i}`,
      created_at: now,
      drift_days: 0,
    }))
    saveSimulatePayload({ campaign, phases })
    navigate(`/campaigns/${SIMULATE_CAMPAIGN_ID}/validate`)
  }

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'fundamentals':
        return (
          <CampaignFundamentals
            data={{
              name: form.name,
              campaign_type: form.campaign_type,
              start_date: form.start_date,
              end_date: form.end_date,
              total_budget: form.total_budget,
              industry: form.industry,
              description: form.description,
            }}
            onChange={updateForm}
          />
        )
      case 'objectives':
        return (
          <ObjectivesKPIs
            data={{
              primary_objective: form.primary_objective,
              primary_kpi: form.primary_kpi,
              target_value: form.target_value,
              secondary_kpis: form.secondary_kpis,
            }}
            onChange={updateForm}
          />
        )
      case 'audience':
        return (
          <TargetAudience
            data={{ target_audience: form.target_audience, audience_type: form.audience_type }}
            onChange={updateForm}
          />
        )
      case 'creative':
        return (
          <CreativeStrategy
            data={form.creative_strategy}
            onChange={(creative_strategy) => updateForm({ creative_strategy })}
          />
        )
      case 'channels':
        return (
          <ChannelPlacement
            data={form.channel_placement}
            onChange={(channel_placement) => updateForm({ channel_placement })}
          />
        )
      case 'budget':
        return (
          <BudgetStrategyComponent
            data={{ ...form.budget_strategy, daily_budget: form.daily_budget }}
            onChange={(updates: Partial<BudgetStrategyType> & { daily_budget?: number | '' }) => {
              const { daily_budget, ...budgetUpdates } = updates
              if (daily_budget !== undefined) updateForm({ daily_budget })
              if (Object.keys(budgetUpdates).length) {
                updateForm({ budget_strategy: { ...form.budget_strategy, ...budgetUpdates } })
              }
            }}
          />
        )
      case 'stages':
        return (
          <div className="space-y-8">
            <StageBuilder stages={stages} onChange={setStages} />
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ad Deliverables
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define ads and posts for this campaign. These will be created as task cards in the Kanban backlog.
              </p>
              <AdDeliverablesEditor
                deliverables={adDeliverables}
                onChange={setAdDeliverables}
              />
            </div>
          </div>
        )
      case 'constraints':
        return (
          <ConstraintsRisks
            data={form.constraints}
            onChange={(constraints) => updateForm({ constraints })}
          />
        )
      case 'tracking':
        return (
          <TrackingSetup
            data={{
              ...form.tracking_setup,
              meta_pixel_id: form.meta_pixel_id,
              meta_ads_account_id: form.meta_ads_account_id,
            }}
            onChange={(updates: Partial<TrackingSetupType> & { meta_pixel_id?: string; meta_ads_account_id?: string }) => {
              const { meta_pixel_id, meta_ads_account_id, ...trackingUpdates } = updates
              if (meta_pixel_id !== undefined) updateForm({ meta_pixel_id })
              if (meta_ads_account_id !== undefined) updateForm({ meta_ads_account_id })
              if (Object.keys(trackingUpdates).length) {
                updateForm({ tracking_setup: { ...form.tracking_setup, ...trackingUpdates } })
              }
            }}
          />
        )
      case 'competitive':
        return (
          <CompetitiveContext
            data={form.competitive_context}
            onChange={(competitive_context) => updateForm({ competitive_context })}
          />
        )
      default:
        return null
    }
  }
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Plan your marketing campaign with AI-powered insights
        </p>
      </div>

      {templateFrom && (
        <Alert className="border-expedition-evergreen/40 bg-expedition-evergreen/10">
          <FileText className="h-4 w-4 text-expedition-evergreen" />
          <AlertDescription>
            <span className="font-medium text-expedition-evergreen">Creating from template:</span>{' '}
            {templateFrom.name}
            {templateFrom.sourcePhaseName && (
              <span className="text-muted-foreground"> (from phase: {templateFrom.sourcePhaseName})</span>
            )}
            . Name and description are pre-filled; complete the rest of the form.
          </AlertDescription>
        </Alert>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
        <div className="flex gap-1.5">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-primary'
                  : i < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
            />
          ))}
        </div>
      </div>

      {/* Current step form (one form per step) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {(() => {
              const Icon = section.icon
              return (
                <>
                  <Icon className="w-5 h-5" />
                  {section.title}
                  {section.required && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </>
              )
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderSectionContent(section.id)}
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation: Back, Next / Create Campaign */}
      <div className="flex justify-between gap-3 pb-8">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          {!isFirstStep && (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {isLastStep && (
            <Button variant="secondary" onClick={handleSimulate} disabled={!canSubmit}>
              Simulate (no Supabase)
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          ) : (
            <Button onClick={goNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
