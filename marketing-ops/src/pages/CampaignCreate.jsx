import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Rocket, Target, Users, Palette, Share2, DollarSign,
  ListChecks, AlertTriangle, BarChart3, Globe, ChevronDown, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createDefaultStages } from '@/lib/defaultStages'
import { stagesToPhaseInserts } from '@/lib/stageUtils'

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

const INITIAL_FORM = {
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

const SECTIONS = [
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

export default function CampaignCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [stages, setStages] = useState([])
  const [expandedSections, setExpandedSections] = useState(new Set(['fundamentals']))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Initialize stages on first render
  useState(() => {
    setStages(createDefaultStages())
  }, [])

  const updateForm = (updates) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  const toggleSection = (id) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
          campaign_type: form.campaign_type,
          status: 'planning',
          description: form.description || null,
          industry: form.industry || null,
          start_date: form.start_date,
          end_date: form.end_date,
          total_budget: Number(form.total_budget),
          daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
          primary_objective: form.primary_objective,
          primary_kpi: form.primary_kpi,
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
      const { error: phasesError } = await supabase
        .from('execution_phases')
        .insert(phaseInserts)

      if (phasesError) throw phasesError

      navigate(`/campaigns/${campaign.id}/validate`)
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(err.message)
      } else {
        setError('Failed to create campaign')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderSectionContent = (sectionId) => {
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
            onChange={(updates) => {
              const { daily_budget, ...budgetUpdates } = updates
              if (daily_budget !== undefined) updateForm({ daily_budget })
              if (Object.keys(budgetUpdates).length) {
                updateForm({ budget_strategy: { ...form.budget_strategy, ...budgetUpdates } })
              }
            }}
          />
        )
      case 'stages':
        return <StageBuilder stages={stages} onChange={setStages} />
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
            onChange={(updates) => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Plan your marketing campaign with AI-powered insights
        </p>
      </div>

      {/* Section accordion */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const Icon = section.icon
          return (
            <Card key={section.id}>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5" />
                    {section.title}
                    {section.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>{renderSectionContent(section.id)}</CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Submit */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  )
}