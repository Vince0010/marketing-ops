import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Zap,
  BarChart3,
  Save,
  Kanban,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { DriftEvent } from '@/types/phase'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'
import { DemographicAlignmentTracker } from '@/components/demographics/DemographicAlignmentTracker'
import { useCampaignExecution } from '@/hooks/useCampaignExecution'
import { cn } from '@/lib/utils'
import { saveTemplate } from '@/lib/templates'
import {
  DEMO_AGE_DATA,
  DEMO_FIT_SCORE,
  DEMO_STRONG_ALIGNMENT,
  DEMO_ADJUSTMENT_AREAS,
  DEMO_RECOMMENDED_ACTIONS,
} from '@/lib/demographicData'
import { KanbanBoard } from '@/components/kanban'
import { ActionCardDriftPanel } from '@/components/kanban/ActionCardDriftPanel'
import { calculateCampaignActionCardDrifts } from '@/utils/actionCardDrift'
import AIRecommendationsEngine from '@/components/ai/AIRecommendationsEngine'
import MetaAdsDashboard from '@/components/meta/MetaAdsDashboard'
// import StrategicFailureDiagnosis from '@/components/diagnosis/StrategicFailureDiagnosis'
// import { OverrideOutcomeAnalysis } from '@/components/diagnosis/OverrideOutcomeAnalysis'
import type { OverrideEvent } from '@/types/database'
import { PerformanceCorrelation } from '@/components/correlation/PerformanceCorrelation'
import { useWeeklyDataReports } from '@/hooks/useWeeklyDataReports'

// DriftEvent type for calculated drift events
type CalculatedDriftEvent = Omit<DriftEvent, 'id' | 'campaign_id' | 'phase_id' | 'created_at'> & {
  status: 'completed' | 'in_progress'
  projected?: boolean
  elapsed_days?: number
  remaining_days?: number
}

type DriftFilterValue = 'all' | 'positive' | 'negative' | 'neutral' | 'projected'

interface StakeholderAction {
  id: string
  action_description: string
  stakeholder_name: string
  stakeholder_role: string
  stakeholder_type: 'client' | 'agency' | 'external'
  status: string
  requested_date: string
  expected_date?: string
  actual_date?: string
  overdue_days?: number
  critical_path?: boolean
  delay_reason?: string
  delay_attribution?: string
  delay_impact?: string
  notes?: string
}

const SEEDED_STAKEHOLDER_ACTIONS: StakeholderAction[] = [
  {
    id: 'sa-001',
    action_description: 'Approve final creative concepts',
    stakeholder_name: 'Sarah Johnson',
    stakeholder_role: 'Marketing Director',
    stakeholder_type: 'client',
    status: 'completed',
    requested_date: '2026-01-15',
    expected_date: '2026-01-18',
    actual_date: '2026-01-20',
    overdue_days: 2,
    critical_path: true,
    delay_reason: 'Stakeholder was on PTO, required additional review round',
    delay_attribution: 'Client',
    delay_impact: 'Pushed creative development phase by 2 days',
    notes: 'Need to confirm stakeholder availability before scheduling reviews',
  },
  {
    id: 'sa-002',
    action_description: 'Provide brand guidelines update',
    stakeholder_name: 'Mike Chen',
    stakeholder_role: 'Brand Manager',
    stakeholder_type: 'client',
    status: 'completed',
    requested_date: '2026-01-10',
    expected_date: '2026-01-12',
    actual_date: '2026-01-11',
  },
  {
    id: 'sa-003',
    action_description: 'Legal compliance sign-off',
    stakeholder_name: 'Legal Team',
    stakeholder_role: 'Compliance',
    stakeholder_type: 'external',
    status: 'overdue',
    requested_date: '2026-01-25',
    expected_date: '2026-01-28',
    overdue_days: 3,
    critical_path: true,
    delay_reason: 'Regulatory concerns with ad copy language',
    delay_attribution: 'External - Legal',
    delay_impact: 'Blocking campaign launch',
  },
]

const stakeholderActions: StakeholderAction[] = SEEDED_STAKEHOLDER_ACTIONS

function formatDate(dateStr: string): string {
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
  // Drift classification filter
  const [driftFilter, setDriftFilter] = useState<DriftFilterValue>('all')
  // Tick state for live drift recalculation (every 60s)
  const [driftTick, setDriftTick] = useState(0)
  // Save as Template (positive drift)
  const [saveTemplateEventIndex, setSaveTemplateEventIndex] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  // Override event for learning loop
  const [overrideEvent, setOverrideEvent] = useState<OverrideEvent | null>(null)

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

  // Helper to get tasks for a specific phase
  const getTasksForPhase = (phaseId: string | null) => {
    return tasks.filter(t => t.phase_id === phaseId)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data } = await supabase.from('campaigns').select('*').eq('id', id).single()
      if (data) {
        setCampaign(data)
        
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
  }

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

  const handleSaveAsTemplate = async (driftEvent: Partial<DriftEvent> & Pick<DriftEvent, 'drift_type' | 'drift_days' | 'phase_name' | 'lesson_learned'>) => {
    try {
      if (!campaign) return

      const templateData = {
        name: `${campaign.campaign_type.replace(/_/g, ' ')} Template - ${driftEvent.lesson_learned?.substring(0, 30)}...`,
        description: `Template created from successful campaign: ${campaign.name}. Key success: ${driftEvent.lesson_learned}`,
        source_campaign_id: campaign.id,
        source_campaign_name: campaign.name,
        success_metrics: `${driftEvent.drift_type} drift of ${Math.abs(driftEvent.drift_days)} days in ${driftEvent.phase_name}`,
        default_phases: JSON.stringify(phases.map(p => ({
          phase_name: p.phase_name,
          duration: p.planned_duration_days,
          type: p.phase_type
        }))),
        recommended_timeline_days: phases.reduce((sum, p) => sum + p.planned_duration_days, 0),
        suitable_campaign_types: [campaign.campaign_type],
        suitable_industries: campaign.industry ? [campaign.industry] : undefined,
        times_used: 0,
        success_rate: 0.85,
        key_success_factors: [driftEvent.lesson_learned || 'Process optimization'],
        created_by: 'current_user',
        is_public: true,
        status: 'active'
      }

      await supabase.from('campaign_templates').insert(templateData)
      console.log('Template saved successfully')
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  // Prepare phase drift chart data
  const phaseDriftChartData = phases.map((phase) => ({
    name: phase.phase_name,
    planned: phase.planned_duration_days,
    actual: phase.actual_duration_days || phase.planned_duration_days,
    phase_number: phase.phase_number
  }))

  // Calculate drift summary stats
  const driftSummary = {
    avgDrift: phases.filter(p => p.drift_days != null).length > 0
      ? Math.round(phases.filter(p => p.drift_days != null).reduce((sum, p) => sum + (p.drift_days || 0), 0) / phases.filter(p => p.drift_days != null).length * 10) / 10
      : 0,
    positiveCount: driftEvents.filter(d => d.drift_type === 'positive').length,
    negativeCount: driftEvents.filter(d => d.drift_type === 'negative').length,
    phasesOnTrack: phases.filter(p => Math.abs(p.drift_days || 0) <= 1).length
  }

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
            {campaign?.gate_overridden && (
              <TabsTrigger value="override" className="text-xs sm:text-sm py-2">Override Learning</TabsTrigger>
            )}
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

            {/* Action Card Drift Analysis */}
            <ActionCardDriftPanel 
              driftAnalyses={actionCardDrifts}
              loading={executionLoading}
            />
          </TabsContent>

          {/* Override Learning Tab */}
          {campaign?.gate_overridden && (
            <TabsContent value="override" className="space-y-4 mt-4">
              {/* <OverrideOutcomeAnalysis
                campaign={campaign}
                overrideEvent={overrideEvent}
              /> */}
              <div className="text-center py-8 text-muted-foreground">
                Override analysis component temporarily disabled
              </div>
            </TabsContent>
          )}

          {/* Drift Analysis Tab */}
          <TabsContent value="drift" className="space-y-4 mt-4">
            {totalDrift > 2 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Significant Timeline Drift</AlertTitle>
                <AlertDescription>
                  Total drift of +{totalDrift} days detected. Review root causes below and consider timeline adjustment.
                </AlertDescription>
              </Alert>
            )}

            {/* Drift Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Average Drift</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${driftSummary.avgDrift > 0 ? 'text-expedition-checkpoint' : driftSummary.avgDrift < 0 ? 'text-expedition-evergreen' : 'text-muted-foreground'}`}>
                    {driftSummary.avgDrift > 0 ? '+' : ''}{driftSummary.avgDrift}d
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per completed phase</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Positive Drifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-expedition-evergreen">{driftSummary.positiveCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ahead of schedule</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Negative Drifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-expedition-checkpoint">{driftSummary.negativeCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Behind schedule</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">On Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">{driftSummary.phasesOnTrack}</div>
                  <p className="text-xs text-muted-foreground mt-1">Within +/-1 day</p>
                </CardContent>
              </Card>
            </div>

            {/* Phase Drift Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Timeline Analysis</CardTitle>
                <CardDescription>Planned vs actual duration for each phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseDriftChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis
                        label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                        fontSize={12}
                      />
                      <Tooltip />
                      <Bar dataKey="planned" fill="#e5e7eb" name="Planned Days" />
                      <Bar dataKey="actual" fill="#3b82f6" name="Actual Days" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drift Events</CardTitle>
                <CardDescription>Track deviations from planned timeline. Filter by sentiment to spot patterns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drift classification summary */}
                {(() => {
                  const positiveCount = driftEvents.filter((e) => e.drift_type === 'positive').length
                  const negativeCount = driftEvents.filter((e) => e.drift_type === 'negative').length
                  const neutralCount = driftEvents.filter((e) => e.drift_type === 'neutral').length
                  const projectedCount = driftEvents.filter((e) => e.projected).length
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Summary:</span>
                      <Badge variant="outline" className="bg-expedition-evergreen/10 text-expedition-evergreen border-expedition-evergreen/40">
                        {positiveCount} Positive
                      </Badge>
                      <Badge variant="outline" className="bg-expedition-checkpoint/10 text-expedition-checkpoint border-expedition-checkpoint/40">
                        {negativeCount} Negative
                      </Badge>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        {neutralCount} Neutral
                      </Badge>
                      {projectedCount > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-400/40 dark:bg-blue-950/30 dark:text-blue-400">
                          {projectedCount} Live
                        </Badge>
                      )}
                    </div>
                  )
                })()}

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={driftFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setDriftFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={driftFilter === 'positive' ? 'default' : 'outline'}
                    className={driftFilter === 'positive' ? 'bg-expedition-evergreen hover:bg-expedition-evergreen/90' : ''}
                    onClick={() => setDriftFilter('positive')}
                  >
                    Positive
                  </Button>
                  <Button
                    size="sm"
                    variant={driftFilter === 'negative' ? 'default' : 'outline'}
                    className={driftFilter === 'negative' ? 'bg-expedition-checkpoint hover:bg-expedition-checkpoint/90' : ''}
                    onClick={() => setDriftFilter('negative')}
                  >
                    Negative
                  </Button>
                  <Button
                    size="sm"
                    variant={driftFilter === 'neutral' ? 'default' : 'outline'}
                    className={driftFilter === 'neutral' ? 'bg-expedition-slate hover:bg-expedition-slate/90' : ''}
                    onClick={() => setDriftFilter('neutral')}
                  >
                    Neutral
                  </Button>
                  {driftEvents.some(d => d.projected) && (
                    <Button
                      size="sm"
                      variant={driftFilter === 'projected' ? 'default' : 'outline'}
                      className={driftFilter === 'projected' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      onClick={() => setDriftFilter('projected')}
                    >
                      Live ({driftEvents.filter(d => d.projected).length})
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {driftEvents.filter(
                    (event) => driftFilter === 'all' || event.drift_type === driftFilter || (driftFilter === 'projected' && event.projected)
                  ).map((event, idx) => {
                    const isPositive = event.drift_type === 'positive'
                    const isNegative = event.drift_type === 'negative'
                    const isNeutral = event.drift_type === 'neutral'
                    const isProjected = event.projected
                    const cardBorder = isProjected
                      ? 'border-dashed border-blue-400/50 bg-blue-50/30 dark:bg-blue-950/20'
                      : isPositive
                        ? 'border-expedition-evergreen/40 bg-expedition-evergreen/10'
                        : isNegative
                          ? 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10'
                          : 'border-border bg-muted/50'
                    return (
                      <div key={idx} className={cn('border-2 rounded-lg p-4 space-y-3', cardBorder)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {isProjected ? (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-blue-500" />
                              </div>
                            ) : isNegative ? (
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
                                {isProjected && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs dark:text-blue-400 dark:border-blue-500">
                                    <Clock className="w-3 h-3 mr-1" /> Live
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Planned: {event.planned_duration}d | {isProjected ? 'Elapsed' : 'Actual'}: {event.actual_duration}d
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={isProjected ? 'outline' : isNegative ? 'destructive' : isPositive ? 'default' : 'secondary'}
                              className={cn(
                                isPositive && !isProjected && 'bg-expedition-evergreen',
                                isProjected && isNegative && 'text-red-600 border-red-400 dark:text-red-400',
                                isProjected && isPositive && 'text-green-600 border-green-400 dark:text-green-400',
                                isProjected && isNeutral && 'text-blue-600 border-blue-400 dark:text-blue-400',
                              )}
                            >
                              {event.drift_days > 0 ? '+' : ''}{event.drift_days}d
                              {isPositive && ' ahead'}
                              {isNegative && ' behind'}
                              {isNeutral && ' on time'}
                            </Badge>
                            {isProjected && event.remaining_days !== undefined && (
                              <span className={cn(
                                "text-xs",
                                event.remaining_days > 0 ? "text-blue-500" : "text-red-500"
                              )}>
                                {event.remaining_days > 0
                                  ? `${event.remaining_days}d remaining`
                                  : `${Math.abs(event.remaining_days)}d over budget`}
                              </span>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">{isProjected ? 'Delay Reasons' : 'Root Cause'}</span>
                            <p className="font-medium">{event.root_cause}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Attribution</span>
                            <p className="font-medium">{event.attribution}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isProjected ? 'Projected Impact' : 'Impact'}</span>
                            <p className="font-medium">{event.impact_on_timeline}</p>
                          </div>
                          {!isProjected && (
                            <div>
                              <span className="text-muted-foreground">Lesson Learned</span>
                              <p className="font-medium">{event.lesson_learned}</p>
                            </div>
                          )}
                        </div>

                        {event.actionable_insight && (
                          <div className={cn(
                            "p-3 rounded-lg border",
                            isProjected
                              ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                              : "bg-expedition-trail/10 border-expedition-trail/20"
                          )}>
                            <p className="text-sm">
                              <Zap className={cn("w-4 h-4 inline mr-1", isProjected ? "text-blue-500" : "text-expedition-trail")} />
                              <span className="font-medium text-expedition-navy dark:text-white">Insight:</span>{' '}
                              <span className="text-foreground">{event.actionable_insight}</span>
                            </p>
                          </div>
                        )}

                        {/* Save as Template - positive completed drift only */}
                        {isPositive && !isProjected && (
                          <div className="bg-expedition-evergreen/10 p-3 rounded-lg border border-expedition-evergreen/20">
                            <p className="text-sm">
                              <TrendingUp className="w-4 h-4 inline mr-1 text-expedition-evergreen" />
                              <span className="font-medium text-expedition-evergreen">Success Pattern Detected</span>
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 gap-2"
                              onClick={() => handleSaveAsTemplate(event)}
                            >
                              <Save className="w-4 h-4" />
                              Save as Template
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
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
            <DemographicAlignmentTracker
              ageData={DEMO_AGE_DATA}
              fitScore={DEMO_FIT_SCORE}
              strongAlignment={DEMO_STRONG_ALIGNMENT}
              adjustmentAreas={DEMO_ADJUSTMENT_AREAS}
              recommendedActions={DEMO_RECOMMENDED_ACTIONS}
              variant="preliminary"
              compact
            />
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
            {/* <StrategicFailureDiagnosis
              campaign={campaign}
              phases={phases}
              driftEvents={driftEvents as unknown as DriftEvent[]}
              onCreateTemplate={(_diagnosis: any) => {
                console.log('Created failure prevention template:', _diagnosis)
              }}
            /> */}
            <div className="text-center py-8 text-muted-foreground">
              Strategic failure diagnosis component temporarily disabled
            </div>
          </TabsContent>

          {/* Accountability Timeline Tab */}
          <TabsContent value="accountability" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Accountability Timeline</CardTitle>
                <CardDescription>
                  Track stakeholder actions, approvals, and delay attribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stakeholderActions.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Stakeholder Actions Yet</h3>
                      <p className="text-muted-foreground">Stakeholder actions and approvals will be tracked here.</p>
                    </div>
                  ) : (
                    stakeholderActions.map((action) => {
                      const isOverdue = action.status === 'overdue' || (action.expected_date && new Date(action.expected_date) < new Date() && action.status !== 'completed')
                      const getActorColor = (type: string) => {
                        switch (type) {
                          case 'client': return 'bg-expedition-summit/10 border-expedition-summit/30 text-expedition-navy dark:text-white'
                          case 'agency': return 'bg-expedition-trail/10 border-expedition-trail/30 text-expedition-navy dark:text-white'
                          case 'external': return 'bg-muted border-border text-foreground'
                          default: return 'bg-muted border-border text-foreground'
                        }
                      }

                      return (
                        <div key={action.id} className={`border rounded-lg p-4 space-y-3 ${isOverdue ? 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`px-3 py-1 rounded-full text-sm border ${getActorColor(action.stakeholder_type)}`}>
                                {action.stakeholder_type.charAt(0).toUpperCase() + action.stakeholder_type.slice(1)}
                              </div>
                              <div>
                                <p className="font-semibold">{action.action_description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {action.stakeholder_name} ({action.stakeholder_role})
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={action.status === 'completed' ? 'default' : isOverdue ? 'destructive' : 'secondary'}>
                                {action.status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : action.status}
                              </Badge>
                              {isOverdue && action.overdue_days && (
                                <p className="text-xs text-expedition-checkpoint mt-1">
                                  {action.overdue_days}d overdue
                                </p>
                              )}
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Requested</span>
                              <p className="font-medium">{formatDate(action.requested_date)}</p>
                            </div>
                            {action.expected_date && (
                              <div>
                                <span className="text-muted-foreground">Expected</span>
                                <p className="font-medium">{formatDate(action.expected_date)}</p>
                              </div>
                            )}
                            {action.actual_date && (
                              <div>
                                <span className="text-muted-foreground">Completed</span>
                                <p className="font-medium">{formatDate(action.actual_date)}</p>
                              </div>
                            )}
                            {action.critical_path && (
                              <div>
                                <span className="text-muted-foreground">Critical Path</span>
                                <Badge variant="warning" className="border-expedition-signal/40">
                                  Critical
                                </Badge>
                              </div>
                            )}
                          </div>

                          {action.delay_reason && (
                            <div className="bg-expedition-signal/10 p-3 rounded-lg border border-expedition-signal/20">
                              <p className="text-sm">
                                <AlertTriangle className="w-4 h-4 inline mr-1 text-expedition-signal" />
                                <span className="font-medium text-expedition-signal">Delay Reason:</span>{' '}
                                <span className="text-foreground">{action.delay_reason}</span>
                              </p>
                              {action.delay_attribution && (
                                <p className="text-xs text-expedition-signal mt-1">
                                  Attribution: {action.delay_attribution}
                                </p>
                              )}
                            </div>
                          )}

                          {action.delay_impact && (
                            <div className="bg-expedition-checkpoint/10 p-3 rounded-lg border border-expedition-checkpoint/20">
                              <p className="text-sm">
                                <span className="font-medium text-expedition-checkpoint">Impact:</span>{' '}
                                <span className="text-foreground">{action.delay_impact}</span>
                              </p>
                            </div>
                          )}

                          {action.notes && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Notes:</span> {action.notes}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
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

        {/* Save as Template dialog (from positive drift) */}
        <Dialog
          open={saveTemplateEventIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSaveTemplateEventIndex(null)
              setTemplateName('')
              setTemplateDescription('')
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create template from success</DialogTitle>
              <DialogDescription>
                Save this positive drift as a reusable template. Phase structure, durations, and lessons will be available for new campaigns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g. Campaign Setup - Reuse"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-desc">Description</Label>
                <Textarea
                  id="template-desc"
                  placeholder="What made this successful? When to use?"
                  rows={3}
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSaveTemplateEventIndex(null)
                  setTemplateName('')
                  setTemplateDescription('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-expedition-evergreen hover:bg-expedition-evergreen/90 gap-1.5"
                onClick={() => {
                  const event = saveTemplateEventIndex != null ? driftEvents[saveTemplateEventIndex] : null
                  saveTemplate({
                    name: templateName.trim() || 'Untitled template',
                    description: templateDescription.trim(),
                    sourcePhaseName: event?.phase_name,
                  })
                  setSaveTemplateEventIndex(null)
                  setTemplateName('')
                  setTemplateDescription('')
                }}
              >
                <Save className="w-4 h-4" />
                Save template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
