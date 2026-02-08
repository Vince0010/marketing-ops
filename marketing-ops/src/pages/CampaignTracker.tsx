import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Kanban,
  Brain,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { DriftEvent } from '@/types/phase'
import type { PerformanceMetric } from '@/types/database'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'
import { DemographicAlignmentTracker } from '@/components/demographics/DemographicAlignmentTracker'
import { useCampaignExecution } from '@/hooks/useCampaignExecution'
import { cn } from '@/lib/utils'
import { campaignCompletionService } from '@/services/campaignCompletionService'
import { KanbanBoard } from '@/components/kanban'
import { ActionCardDriftPanel } from '@/components/kanban/ActionCardDriftPanel'
import { calculateCampaignActionCardDrifts } from '@/utils/actionCardDrift'
import AIRecommendationsEngine from '@/components/ai/AIRecommendationsEngine'
import MetaAdsDashboard from '@/components/meta/MetaAdsDashboard'
import StrategicFailureDiagnosis from '@/components/diagnosis/StrategicFailureDiagnosis'
import type { OverrideEvent } from '@/types/database'
import { detectStrategicFailure, createStrategicFailure } from '@/services/strategicFailureService'
import { PerformanceCorrelation } from '@/components/correlation/PerformanceCorrelation'
import { useWeeklyDataReports } from '@/hooks/useWeeklyDataReports'
import type { AgeRow } from '@/components/demographics/DemographicAlignmentTracker'
import { AccountabilityTimeline } from '@/components/accountability/AccountabilityTimeline'
import { fetchStakeholderActions } from '@/services/accountabilityService'
import type { StakeholderAction } from '@/types/database'

// DriftEvent type for calculated drift events
type CalculatedDriftEvent = Omit<DriftEvent, 'id' | 'campaign_id' | 'phase_id' | 'created_at'> & {
  status: 'completed' | 'in_progress'
  projected?: boolean
  elapsed_days?: number
  remaining_days?: number
}

/**
 * Transform campaign target_audience demographics into age data for DemographicAlignmentTracker
 * Distributes target age ranges evenly across the demographic
 * Actual data will come from Meta Ads performance later
 */
function transformCampaignDemographicsToAgeData(campaign: Campaign | null): AgeRow[] {
  const allAgeRanges = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
  
  if (!campaign?.target_audience?.demographics?.age_range?.length) {
    // No targeting specified - return all zeros
    return allAgeRanges.map(range => ({
      range,
      goal: 0,
      actual: 0,
      diff: 0
    }))
  }

  const targetedRanges = campaign.target_audience.demographics.age_range
  const goalPercentPerRange = Math.round(100 / targetedRanges.length)
  
  return allAgeRanges.map(range => {
    const isTargeted = targetedRanges.includes(range)
    return {
      range,
      goal: isTargeted ? goalPercentPerRange : 0,
      actual: 0, // Will be populated from Meta Ads data in future
      diff: 0 // Will calculate when actual data is available
    }
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  // Tick state for live drift recalculation (every 60s)
  const [driftTick, setDriftTick] = useState(0)
  // Override event for learning loop
  const [, setOverrideEvent] = useState<OverrideEvent | null>(null)
  // Database drift events (action card drift)
  const [dbDriftEvents, setDbDriftEvents] = useState<DriftEvent[]>([])
  // Strategic failure detection
  const [generatingDiagnosis, setGeneratingDiagnosis] = useState(false)
  // Stakeholder actions for accountability tracking
  const [stakeholderActions, setStakeholderActions] = useState<StakeholderAction[]>([])
  const [loadingActions, setLoadingActions] = useState(true)

  // Get execution data from hook
  const execution = useCampaignExecution(id || '')
  const {
    phases,
    tasks,
    history,
    loading: executionLoading,
    refetch: refetchExecution
  } = execution

  // Tick every 60s for live drift updates when phases are in progress
  useEffect(() => {
    const hasInProgress = phases.some(p => p.status === 'in_progress' && p.actual_start_date)
    if (!hasInProgress) return
    const interval = setInterval(() => setDriftTick(t => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [phases])

  // Calculate drift events dynamically from phases and tasks (including live projected drift)
  const driftEvents = useMemo((): CalculatedDriftEvent[] => {
    void driftTick // read to trigger recalculation on tick

    const calculateImpact = (driftDays: number): string => {
      if (driftDays > 0) return `Delayed timeline by ${driftDays} days`
      if (driftDays < 0) return `Recovered ${Math.abs(driftDays)} days`
      return 'No change to timeline'
    }

    // Pass 1: Completed phases (existing logic)
    const completedDrifts: CalculatedDriftEvent[] = phases
      .filter(phase => phase.status === 'completed' || (phase.status !== 'in_progress' && phase.drift_days !== 0))
      .map(phase => {
        const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
        const delayReasons = phaseTasks
          .map(t => t.delay_reason)
          .filter(Boolean)
          .join('; ')

        const driftDays = phase.drift_days || 0
        const driftType = phase.drift_type ||
          (driftDays > 1 ? 'negative' : driftDays < -1 ? 'positive' : 'neutral')

        return {
          drift_type: driftType,
          drift_days: driftDays,
          phase_name: phase.phase_name,
          planned_duration: phase.planned_duration_days,
          actual_duration: phase.actual_duration_days || phase.planned_duration_days,
          root_cause: phase.drift_reason || delayReasons || 'No cause recorded',
          attribution: phase.owner || 'Not specified',
          impact_on_timeline: calculateImpact(driftDays),
          lesson_learned: phase.drift_reason || delayReasons || 'No lesson recorded',
          actionable_insight: undefined,
          template_worthy: driftType === 'positive',
          status: 'completed' as const,
          projected: false,
        }
      })

    // Pass 2: In-progress phases (projected drift — live)
    const inProgressDrifts: CalculatedDriftEvent[] = phases
      .filter(phase => phase.status === 'in_progress' && phase.actual_start_date)
      .map(phase => {
        const now = new Date()
        const startDate = new Date(phase.actual_start_date!)
        const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const projectedDriftDays = elapsedDays - phase.planned_duration_days
        const driftType = projectedDriftDays > 1 ? 'negative'
          : projectedDriftDays < -1 ? 'positive'
          : 'neutral'

        const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
        const delayReasons = phaseTasks
          .map(t => t.delay_reason)
          .filter(Boolean)
          .join('; ')

        return {
          drift_type: driftType,
          drift_days: projectedDriftDays,
          phase_name: phase.phase_name,
          planned_duration: phase.planned_duration_days,
          actual_duration: elapsedDays,
          root_cause: delayReasons || 'Phase still in progress',
          attribution: phase.owner || 'Not specified',
          impact_on_timeline: projectedDriftDays > 0
            ? `Projected delay of ${projectedDriftDays} days`
            : projectedDriftDays < 0
            ? `${Math.abs(projectedDriftDays)} days ahead of schedule`
            : 'On track',
          lesson_learned: 'Phase in progress',
          actionable_insight: projectedDriftDays > 0
            ? 'Consider reallocating resources to prevent further delay'
            : undefined,
          template_worthy: false,
          status: 'in_progress' as const,
          projected: true,
          elapsed_days: elapsedDays,
          remaining_days: phase.planned_duration_days - elapsedDays,
        }
      })

    return [...completedDrifts, ...inProgressDrifts]
  }, [phases, tasks, driftTick])

  // Calculate action card drift analysis (per ad deliverable)
  const actionCardDrifts = useMemo(() => {
    return calculateCampaignActionCardDrifts(tasks, history)
  }, [tasks, history])

  // Get weekly data reports and correlation insights
  // Note: driftEvents is passed as empty array initially, correlation uses phases/tasks directly
  const {
    weeklyReports,
    correlationInsights,
    correlationSummary,
    isAnalyzing,
    error: weeklyError,
    runCorrelationAnalysis,
  } = useWeeklyDataReports(
    id,
    campaign?.name || '',
    phases,
    tasks,
    [] // Don't pass driftEvents here - the hook fetches drift_events from DB
  )

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase.from('campaigns').select('*').eq('id', id).single()
      if (data) {
        setCampaign(data)

        // Fetch performance metrics for observation mode
        const { data: metrics } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('campaign_id', id)
          .order('metric_date', { ascending: true })
        
        if (metrics) setPerformanceMetrics(metrics)

        // Fetch override event if campaign has override
        if (data.gate_overridden) {
          const { data: override } = await supabase
            .from('override_events')
            .select('*')
            .eq('campaign_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (override) setOverrideEvent(override as OverrideEvent)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchDriftEvents = useCallback(async () => {
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('drift_events')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDbDriftEvents(data || [])
      console.log('[CampaignTracker] Loaded drift events from database:', data?.length || 0)
    } catch (error) {
      console.error('[CampaignTracker] Error loading drift events:', error)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    fetchDriftEvents()
  }, [id, fetchData, fetchDriftEvents])

  // Fetch stakeholder actions
  const fetchActions = useCallback(async () => {
    if (!id) return
    setLoadingActions(true)
    try {
      const { data, error } = await fetchStakeholderActions(id)
      if (error) {
        console.error('[CampaignTracker] Error loading stakeholder actions:', error)
      } else {
        setStakeholderActions(data || [])
      }
    } catch (error) {
      console.error('[CampaignTracker] Error:', error)
    } finally {
      setLoadingActions(false)
    }
  }, [id])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  // Refetch drift events whenever tasks change (after moves, status changes, etc.)
  useEffect(() => {
    if (id && tasks.length > 0) {
      fetchDriftEvents()
    }
  }, [tasks, id, fetchDriftEvents])

  const handleRefreshDriftAnalysis = async () => {
    await refetchExecution()
    await fetchDriftEvents()
  }

  // Handle strategic failure diagnosis generation
  const handleGenerateDiagnosis = useCallback(async () => {
    if (!campaign) return
    
    setGeneratingDiagnosis(true)
    try {
      const { data, error } = await createStrategicFailure(campaign, phases)
      
      if (error) {
        console.error('Error generating diagnosis:', error)
        alert('Failed to generate diagnosis. See console for details.')
      } else if (data) {
        console.log('Strategic failure diagnosis created:', data)
        // Refresh data to show new diagnosis
        await fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setGeneratingDiagnosis(false)
    }
  }, [campaign, phases, fetchData])

  const handleStartPhase = async (phaseId: string) => {
    const now = new Date().toISOString().split('T')[0]
    try {
      await supabase
        .from('execution_phases')
        .update({
          status: 'in_progress',
          actual_start_date: now,
        })
        .eq('id', phaseId)
      await refetchExecution()
    } catch (error) {
      console.error('Error starting phase:', error)
    }
  }

  const handleCompletePhase = async (phaseId: string) => {
    const now = new Date().toISOString().split('T')[0]
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase || !phase.actual_start_date) return

    const actualDays = Math.ceil(
      (new Date(now).getTime() - new Date(phase.actual_start_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const driftDays = actualDays - phase.planned_duration_days
    const driftType = driftDays > 1 ? 'negative' : driftDays < -1 ? 'positive' : 'neutral'

    // Check if this is the last phase
    const isLastPhase = phase.phase_number === Math.max(...phases.map(p => p.phase_number))

    try {
      await supabase
        .from('execution_phases')
        .update({
          status: 'completed',
          actual_end_date: now,
          actual_duration_days: actualDays,
          drift_days: driftDays,
          drift_type: driftType,
        })
        .eq('id', phaseId)
      
      await refetchExecution()

      // If this is the last phase, trigger campaign completion processing
      if (isLastPhase && campaign) {
        console.log('[CampaignTracker] Last phase completed, triggering campaign completion')
        try {
          await campaignCompletionService.processCampaignCompletion(campaign.id)
          console.log('[CampaignTracker] Campaign completion processing successful')
          // Refetch campaign data to update UI
          await refetchExecution()
        } catch (completionError) {
          console.error('[CampaignTracker] Error processing campaign completion:', completionError)
          // Don't block the UI - completion processing can be retried
        }
      }
    } catch (error) {
      console.error('Error completing phase:', error)
    }
  }

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-expedition-evergreen/40 bg-expedition-evergreen/10'
      case 'in_progress':
        return 'border-expedition-summit/40 bg-expedition-summit/10'
      case 'blocked':
        return 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10'
      default:
        return 'border-border bg-card'
    }
  }

  const getPhaseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'in_progress':
        return <Badge variant="inProgress">In Progress</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  // Calculate real health indicators based on campaign data (includes projected drift)
  const calculateHealthIndicators = () => {
    const completedPhases = phases.filter(p => p.status === 'completed')
    const inProgressPhases = phases.filter(p => p.status === 'in_progress' && p.actual_start_date)
    const totalPhases = phases.length

    let operationalHealth = 100
    if (totalPhases > 0) {
      // Count in-progress phases as partial (0.5) completion
      const progressRate = ((completedPhases.length + inProgressPhases.length * 0.5) / totalPhases) * 100

      // Drift from completed phases
      const completedDrift = completedPhases.reduce((acc, p) => acc + Math.abs(p.drift_days || 0), 0)

      // Projected drift from in-progress phases (only penalize overdue)
      const projectedDrift = inProgressPhases.reduce((acc, p) => {
        const elapsedDays = Math.ceil((Date.now() - new Date(p.actual_start_date!).getTime()) / 86400000)
        return acc + Math.max(0, elapsedDays - p.planned_duration_days)
      }, 0)

      const activeCount = completedPhases.length + inProgressPhases.length || 1
      const avgDrift = (completedDrift + projectedDrift) / activeCount
      const driftPenalty = Math.min(avgDrift * 5, 30)
      operationalHealth = Math.max(progressRate - driftPenalty, 0)
    }

    const performanceHealth = campaign?.performance_health ??
      (campaign?.status === 'completed' ? 85 :
        campaign?.status === 'in_progress' ? 75 : 90)

    // Total drift includes both completed and projected
    const completedDrift = completedPhases.reduce((acc, p) => acc + Math.abs(p.drift_days || 0), 0)
    const projectedDrift = inProgressPhases.reduce((acc, p) => {
      if (!p.actual_start_date) return acc
      const elapsedDays = Math.ceil((Date.now() - new Date(p.actual_start_date).getTime()) / 86400000)
      return acc + Math.max(0, elapsedDays - p.planned_duration_days)
    }, 0)

    return {
      operational: Math.round(operationalHealth),
      performance: Math.round(performanceHealth),
      totalDrift: completedDrift + projectedDrift
    }
  }

  const { operational: operationalHealth, performance: performanceHealth, totalDrift } = calculateHealthIndicators()

  if (loading || executionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-expedition-trail" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Not Found</h1>
            <p className="text-muted-foreground mt-1">Campaign ID: {id}</p>
          </div>
        </div>
        <div className="bg-expedition-signal/10 border border-expedition-signal/40 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-expedition-signal mb-2">Demo Mode</h3>
          <p className="text-expedition-slate dark:text-white/80 mb-4">
            This campaign doesn&apos;t exist in the database yet. You can:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
            <li>Apply the seed data to your Supabase database</li>
            <li>Create a new campaign from the dashboard</li>
            <li>Check the database connection at <a href="/db-test" className="underline">/db-test</a></li>
          </ul>
          <div className="text-sm text-expedition-signal">
            Expected campaign IDs: camp-successful-001, camp-failure-003, camp-accountability-005
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Execution Tracker</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {campaign?.gate_overridden && (
            <ObservationModeBadge
              riskScore={campaign.risk_score}
              campaignStatus={campaign?.status}
              performanceHealth={campaign?.performance_health}
              targetValue={campaign?.target_value}
              currentValue={performanceMetrics.length > 0 ? performanceMetrics[performanceMetrics.length - 1].roas : undefined}
              primaryKPI={campaign?.primary_kpi}
            />
          )}
          <Badge variant="default" className="gap-2 bg-expedition-trail">
            <Activity className="w-4 h-4" />
            In Progress
          </Badge>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operational Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${operationalHealth >= 80 ? 'text-expedition-evergreen' : operationalHealth >= 60 ? 'text-expedition-signal' : 'text-expedition-checkpoint'}`}>
                {operationalHealth}%
              </span>
              <TrendingUp className={`w-5 h-5 ${operationalHealth >= 80 ? 'text-expedition-evergreen' : 'text-expedition-signal'}`} />
            </div>
            <Progress value={operationalHealth} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${performanceHealth >= 80 ? 'text-expedition-evergreen' : performanceHealth >= 60 ? 'text-expedition-signal' : 'text-expedition-checkpoint'}`}>
                {performanceHealth}%
              </span>
              <BarChart3 className="w-5 h-5 text-expedition-signal" />
            </div>
            <Progress value={performanceHealth} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Timeline Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${totalDrift > 0 ? 'text-expedition-checkpoint' : totalDrift < 0 ? 'text-expedition-evergreen' : 'text-muted-foreground'}`}>
                {totalDrift > 0 ? '+' : ''}{totalDrift}d
              </span>
              {totalDrift > 0 ? (
                <TrendingDown className="w-5 h-5 text-expedition-checkpoint" />
              ) : (
                <TrendingUp className="w-5 h-5 text-expedition-evergreen" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {phases.filter((p) => p.status === 'completed').length}/{phases.length} phases complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drift Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driftEvents.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-expedition-checkpoint">{driftEvents.filter(d => d.drift_type === 'negative' && !d.projected).length} delays</span>
              <span className="text-xs text-expedition-evergreen">{driftEvents.filter(d => d.drift_type === 'positive').length} ahead</span>
              {driftEvents.some(d => d.projected) && (
                <span className="text-xs text-blue-500">{driftEvents.filter(d => d.projected).length} projected</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="execution" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-9 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="execution" className="text-xs sm:text-sm py-2">Execution</TabsTrigger>
            <TabsTrigger value="drift" className="text-xs sm:text-sm py-2">Drift Analysis</TabsTrigger>
            <TabsTrigger value="correlation" className="text-xs sm:text-sm py-2">Correlations</TabsTrigger>
            <TabsTrigger value="audience" className="text-xs sm:text-sm py-2">Audience Insights</TabsTrigger>
            <TabsTrigger value="meta-ads" className="text-xs sm:text-sm py-2">Meta Ads</TabsTrigger>
            <TabsTrigger value="diagnosis" className="text-xs sm:text-sm py-2">Failure Diagnosis</TabsTrigger>
            <TabsTrigger value="accountability" className="text-xs sm:text-sm py-2">Accountability</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm py-2">AI Recommendations</TabsTrigger>
          </TabsList>

          {/* Execution Timeline Tab */}
          <TabsContent value="execution" className="space-y-4 mt-4">
            {/* Observation Mode Alert */}
            {campaign?.gate_overridden && campaign.status === 'in_progress' && (
              <ObservationModeBadge
                riskScore={campaign.risk_score}
                campaignStatus={campaign.status}
                startDate={campaign.start_date}
                endDate={campaign.end_date}
                performanceHealth={campaign.performance_health}
                targetValue={campaign.target_value}
                currentValue={performanceMetrics.length > 0 ? performanceMetrics[performanceMetrics.length - 1].roas : undefined}
                primaryKPI={campaign.primary_kpi}
                showFullAlert={true}
              />
            )}
            
            {/* Ad Deliverables Board (Kanban) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Kanban className="w-5 h-5" />
                  Ad Deliverables Board
                </CardTitle>
                <CardDescription>
                  Drag and drop ads between phases. Changes sync in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {id && <KanbanBoard campaignId={id} externalData={execution} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drift Analysis Tab */}
          <TabsContent value="drift" className="space-y-4 mt-4">
            {/* Ad Deliverable Drift Analysis (per action card, calculated from history) */}
            <ActionCardDriftPanel
              driftAnalyses={actionCardDrifts}
              loading={executionLoading}
              onRefresh={handleRefreshDriftAnalysis}
            />

            {/* Database Drift Events (generated on phase transitions) */}
            {dbDriftEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Phase Transition Drift Events</CardTitle>
                  <CardDescription>
                    Drift recorded each time an ad deliverable completes a phase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dbDriftEvents.map((event) => {
                      const isPositive = event.drift_type === 'positive'
                      const isNegative = event.drift_type === 'negative'
                      const cardBorder = isPositive
                        ? 'border-expedition-evergreen/40 bg-expedition-evergreen/10'
                        : isNegative
                          ? 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10'
                          : 'border-border bg-muted/50'
                      return (
                        <div key={event.id} className={cn('border-2 rounded-lg p-4 space-y-2', cardBorder)}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {isNegative ? (
                                <div className="w-8 h-8 rounded-full bg-expedition-checkpoint/20 flex items-center justify-center">
                                  <ArrowUp className="w-4 h-4 text-expedition-checkpoint" />
                                </div>
                              ) : isPositive ? (
                                <div className="w-8 h-8 rounded-full bg-expedition-evergreen/20 flex items-center justify-center">
                                  <ArrowDown className="w-4 h-4 text-expedition-evergreen" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{event.phase_name}</p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      isPositive && 'border-expedition-evergreen text-expedition-evergreen',
                                      isNegative && 'border-expedition-checkpoint text-expedition-checkpoint'
                                    )}
                                  >
                                    {event.drift_days > 0 ? '+' : ''}{event.drift_days}d
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Recorded: {formatDate(event.created_at || '')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm space-y-2">
                            <p className="text-muted-foreground">{event.impact_description}</p>
                            {event.reason && (
                              <p className="text-foreground"><span className="font-medium">Reason:</span> {event.reason}</p>
                            )}
                            {event.root_cause && (
                              <p className="text-foreground"><span className="font-medium">Root Cause:</span> {event.root_cause}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Planned:</span>
                                <span className="ml-1 font-medium">{event.planned_duration}d</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Actual:</span>
                                <span className="ml-1 font-medium">{event.actual_duration}d</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Correlation Analysis Tab */}
          <TabsContent value="correlation" className="space-y-4 mt-4">
            <PerformanceCorrelation
              weeklyReports={weeklyReports}
              correlationInsights={correlationInsights}
              correlationSummary={correlationSummary}
              isLoading={false}
              isAnalyzing={isAnalyzing}
              error={weeklyError}
              onRunAnalysis={runCorrelationAnalysis}
            />
          </TabsContent>

          {/* Audience Insights Tab */}
          <TabsContent value="audience" className="space-y-4 mt-4">
            {campaign?.target_audience?.demographics ? (
              <DemographicAlignmentTracker
                ageData={transformCampaignDemographicsToAgeData(campaign)}
                fitScore={0} // Will be calculated from Meta Ads performance data
                strongAlignment={
                  campaign.target_audience.demographics.age_range
                    ? [`Targeting ${campaign.target_audience.demographics.age_range.join(', ')} age groups`]
                    : []
                }
                adjustmentAreas={[
                  'No performance data available yet',
                  'Meta Ads data will populate after campaign launch'
                ]}
                recommendedActions={[
                  'Launch campaign to start collecting audience data',
                  'Monitor Meta Ads demographics in Meta Ads tab',
                  'Actual vs target alignment will appear after 7+ days'
                ]}
                variant="preliminary"
                compact
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Audience Insights</CardTitle>
                  <CardDescription>
                    No target audience demographics specified for this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Edit the campaign to add target audience demographics (age, gender, location) to see insights here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Meta Ads Dashboard Tab */}
          <TabsContent value="meta-ads" className="space-y-4 mt-4">
            <MetaAdsDashboard
              campaign={campaign}
              metaPixelId={campaign.meta_pixel_id}
              metaAccountId={campaign.meta_ads_account_id}
            />
          </TabsContent>

          {/* Strategic Failure Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4 mt-4">
            {campaign && (() => {
              const detection = detectStrategicFailure(campaign, phases)
              
              // Show "Generate Diagnosis" button if qualifies but no diagnosis exists yet
              if (detection.shouldTrigger && !loading) {
                return (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-900">
                        <AlertTriangle className="w-5 h-5" />
                        Strategic Failure Detected
                      </CardTitle>
                      <CardDescription className="text-yellow-700">
                        {detection.detectionCriteria}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-white rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-sm mb-2">Detection Summary:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Average Drift:</span>
                            <span className="font-medium ml-2">{detection.avgDrift.toFixed(1)} days</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Performance Health:</span>
                            <span className="font-medium ml-2">{detection.performanceHealth}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-yellow-800">
                        Clean execution with low drift indicates this is a <strong>strategic issue</strong> (creative, targeting, timing, or value proposition) rather than an operational problem.
                      </p>
                      <Button 
                        onClick={handleGenerateDiagnosis}
                        disabled={generatingDiagnosis}
                        className="w-full gap-2"
                      >
                        {generatingDiagnosis ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Generate AI Diagnosis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              }
              
              // Otherwise show the diagnosis component (will handle its own states)
              return (
                <StrategicFailureDiagnosis
                  campaign={campaign}
                  phases={phases}
                  driftEvents={driftEvents as unknown as DriftEvent[]}
                  onCreateTemplate={(_diagnosis: any) => {
                    console.log('Created failure prevention template:', _diagnosis)
                  }}
                />
              )
            })()}
          </TabsContent>

          {/* Accountability Timeline Tab */}
          <TabsContent value="accountability" className="space-y-4 mt-4">
            {loadingActions ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-muted-foreground">Loading accountability data...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AccountabilityTimeline
                campaignId={id!}
                actions={stakeholderActions}
                onActionCreated={fetchActions}
                onActionCompleted={fetchActions}
              />
            )}
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <AIRecommendationsEngine
              campaign={campaign}
              phases={phases}
              driftEvents={driftEvents as unknown as DriftEvent[]}
            />
          </TabsContent>

        </Tabs>

      </div>
    </div>
  )
}
