import { useState, useEffect, useCallback } from 'react'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  XCircle,
  Save,
  Kanban,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { DriftEvent } from '@/types/phase'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'
import { DemographicAlignmentTracker } from '@/components/demographics/DemographicAlignmentTracker'
import { KanbanBoard } from '@/components/kanban'
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

const SEEDED_DRIFT_EVENTS: Omit<DriftEvent, 'id' | 'campaign_id' | 'phase_id' | 'created_at'>[] = [
  {
    drift_type: 'negative',
    drift_days: 3,
    phase_name: 'Creative Development',
    planned_duration: 5,
    actual_duration: 8,
    root_cause: 'Design revisions requested by stakeholders',
    attribution: 'Mike Chen',
    impact_on_timeline: 'Delayed launch by 2 days',
    lesson_learned: 'Build in stakeholder review buffer',
    actionable_insight: 'Add a stakeholder review checkpoint after initial concepts',
    template_worthy: true,
  },
  {
    drift_type: 'positive',
    drift_days: -1,
    phase_name: 'Campaign Setup',
    planned_duration: 3,
    actual_duration: 2,
    root_cause: 'Reused template from previous campaign',
    attribution: 'Emily Davis',
    impact_on_timeline: 'Recovered 1 day',
    lesson_learned: 'Maintain campaign templates for recurring types',
    actionable_insight: 'Create a template library for common campaign setups',
    template_worthy: true,
  },
  {
    drift_type: 'negative',
    drift_days: 2,
    phase_name: 'Compliance Review',
    planned_duration: 2,
    actual_duration: 4,
    root_cause: 'Legal team flagged ad copy for regulatory concerns',
    attribution: 'Legal Team',
    impact_on_timeline: 'Added 2 days to pre-launch',
    lesson_learned: 'Submit compliance review earlier in process',
    actionable_insight: 'Run parallel compliance reviews during creative phase',
    template_worthy: false,
  },
  {
    drift_type: 'neutral',
    drift_days: 0,
    phase_name: 'QA Review',
    planned_duration: 2,
    actual_duration: 2,
    root_cause: 'Standard process followed',
    attribution: 'QA Team',
    impact_on_timeline: 'No change to timeline',
    lesson_learned: 'QA process is predictable',
    actionable_insight: undefined,
    template_worthy: false,
  },
]

// For now use the seeded events as the runtime drift events list
const driftEvents: (Omit<DriftEvent, 'id' | 'campaign_id' | 'phase_id' | 'created_at'>)[] = SEEDED_DRIFT_EVENTS

type DriftFilterValue = 'all' | 'positive' | 'negative' | 'neutral'

type RecommendationActionState = 'pending' | 'accepted' | 'rejected' | 'completed'

// AI Recommendations seed data
const AI_RECOMMENDATIONS: {
  tier: 'immediate' | 'tactical' | 'strategic'
  title: string
  description: string
  category: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  icon: React.ReactNode
}[] = [
    {
      tier: 'immediate',
      title: 'Pause underperforming ad sets',
      description: 'Ad sets with CTR below 0.5% are draining budget. Pause and reallocate.',
      category: 'Budget Optimization',
      impact: 'high',
      effort: 'low',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      tier: 'tactical',
      title: 'A/B test new creative variants',
      description: 'Current creatives showing fatigue. Test 3 new variants targeting 25-34 demo.',
      category: 'Creative',
      impact: 'high',
      effort: 'medium',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      tier: 'tactical',
      title: 'Expand lookalike audiences',
      description: 'Top 1% lookalike exhausted. Expand to 2-3% for fresh reach.',
      category: 'Audience',
      impact: 'medium',
      effort: 'low',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      tier: 'strategic',
      title: 'Consider channel diversification',
      description: 'Heavy reliance on Meta. Evaluate TikTok/Google for audience expansion.',
      category: 'Strategy',
      impact: 'high',
      effort: 'high',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ]

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  // Drift classification filter
  const [driftFilter, setDriftFilter] = useState<DriftFilterValue>('all')
  // Save as Template (positive drift)
  const [saveTemplateEventIndex, setSaveTemplateEventIndex] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  // Recommendation action states
  const [recommendationStates, setRecommendationStates] = useState<Record<string, RecommendationActionState>>({})
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})

  // Get tasks from Kanban board for phase metrics
  // Get execution data from hook
  const execution = useCampaignExecution(id || '')
  const {
    phases,
    tasks,
    loading: executionLoading,
    refetch: refetchExecution
  } = execution

  // Helper to get tasks for a specific phase
  const getTasksForPhase = (phaseId: string | null) => {
    return tasks.filter(t => t.phase_id === phaseId)
  }

  // Helper to calculate time in minutes for tasks
  const calculateTotalTime = (phaseTasks: typeof tasks) => {
    return phaseTasks.reduce((sum, task) => {
      const minutes = task.time_in_phase_minutes || 0
      if (task.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(task.started_at).getTime()) / 60000)
        return sum + minutes + elapsed
      }
      return sum + minutes
    }, 0)
  }

  // Format minutes to human readable
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single()

      if (data) setCampaign(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

      // Refresh execution data
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
      // Update the phase
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

      // Refresh execution data
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

  // Calculate real health indicators based on campaign data
  const calculateHealthIndicators = () => {
    const completedPhases = phases.filter(p => p.status === 'completed')
    const totalPhases = phases.length

    // Operational Health: Based on phase completion rate and drift
    let operationalHealth = 100
    if (totalPhases > 0) {
      const completionRate = (completedPhases.length / totalPhases) * 100
      const avgDrift = completedPhases.length > 0
        ? Math.abs(completedPhases.reduce((acc, p) => acc + (p.drift_days || 0), 0) / completedPhases.length)
        : 0

      // Reduce health based on drift (more than 2 days average is concerning)
      const driftPenalty = Math.min(avgDrift * 5, 30) // Max 30 point penalty
      operationalHealth = Math.max(completionRate - driftPenalty, 0)
    }

    // Performance Health: Use campaign data or calculate from phases
    const performanceHealth = campaign?.performance_health ??
      (campaign?.status === 'completed' ? 85 :
        campaign?.status === 'in_progress' ? 75 : 90)

    // Total drift calculation
    const totalDrift = completedPhases.reduce((acc, p) => acc + Math.abs(p.drift_days || 0), 0)

    return {
      operational: Math.round(operationalHealth),
      performance: Math.round(performanceHealth),
      totalDrift
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
        created_by: 'current_user', // TODO: Get from auth context
        is_public: true,
        status: 'active'
      }

      await supabase.from('campaign_templates').insert(templateData)

      // Show success feedback (you could add a toast notification here)
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
            This campaign doesn't exist in the database yet. You can:
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
              <span className="text-xs text-expedition-checkpoint">{driftEvents.filter(d => d.drift_type === 'negative').length} delays</span>
              <span className="text-xs text-expedition-evergreen">{driftEvents.filter(d => d.drift_type === 'positive').length} ahead</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution, Drift, Audience Insights, AI Recommendations */}
      <div className="space-y-4">
        <Tabs defaultValue="execution" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="execution" className="text-xs sm:text-sm py-2">Execution</TabsTrigger>
            <TabsTrigger value="drift" className="text-xs sm:text-sm py-2">Drift Analysis</TabsTrigger>
            <TabsTrigger value="audience" className="text-xs sm:text-sm py-2">Audience Insights</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm py-2">AI Recommendations</TabsTrigger>
          </TabsList>

          {/* Execution Timeline Tab */}
          <TabsContent value="execution" className="space-y-4 mt-4">
            {/* Horizontal Timeline View */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Timeline</CardTitle>
                <CardDescription>Click a phase to start or complete it</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Horizontal scroll container */}
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {phases.map((phase, i) => {
                    const phaseTasks = getTasksForPhase(phase.id)
                    const completedTasks = phaseTasks.filter(t => t.status === 'completed').length
                    const totalTime = calculateTotalTime(phaseTasks)

                    return (
                      <div key={phase.id} className="flex items-center">
                        <Card
                          className={cn(
                            "min-w-[220px] border-2 cursor-pointer hover:shadow-md transition-all",
                            getPhaseStatusColor(phase.status)
                          )}
                          onClick={() => {
                            if (phase.status === 'pending' || !phase.status) {
                              handleStartPhase(phase.id)
                            } else if (phase.status === 'in_progress') {
                              handleCompletePhase(phase.id)
                            }
                          }}
                        >
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              {getPhaseStatusBadge(phase.status || 'pending')}
                              <Badge variant="secondary" className="text-xs">
                                {phaseTasks.length} tasks
                              </Badge>
                            </div>

                            <h4 className="font-semibold text-sm">{phase.phase_name}</h4>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Planned</span>
                            <span>{phase.planned_duration_days}d</span>
                          </div>
                          {phase.actual_duration_days != null && (
                            <div className="flex justify-between">
                              <span>Actual</span>
                              <span className={phase.drift_days > 0 ? 'text-expedition-checkpoint font-semibold' : phase.drift_days < 0 ? 'text-expedition-evergreen font-semibold' : ''}>
                                {phase.actual_duration_days}d
                              </span>
                            </div>
                          )}
                          {phase.owner && (
                            <div className="flex justify-between">
                              <span>Owner</span>
                              <span className="font-medium text-foreground">{phase.owner}</span>
                            </div>
                          )}
                        </div>

                        {/* Drift indicator */}
                        {phase.status === 'completed' && phase.drift_days !== 0 && (
                          <div className={`flex items-center gap-1 text-xs font-semibold ${phase.drift_days > 0 ? 'text-expedition-checkpoint' : 'text-expedition-evergreen'}`}>
                            {phase.drift_days > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(phase.drift_days)}d {phase.drift_days > 0 ? 'over' : 'under'}
                          </div>
                        )}

                        {/* Action buttons */}
                        {phase.status === 'pending' && (
                          <Button
                            size="sm"
                            className="w-full gap-1"
                            onClick={() => handleStartPhase(phase.id)}
                          >
                            <Play className="w-3 h-3" />
                            Start Phase
                          </Button>
                        )}
                        {phase.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1 border-expedition-evergreen/50 text-expedition-evergreen hover:bg-expedition-evergreen/10"
                            onClick={() => handleCompletePhase(phase.id)}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Complete
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                        {/* Connector arrow */}
                        {i < phases.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-muted-foreground mx-1 shrink-0" />
                        )}
                      </div>
                    )
                  })}

                  {phases.length === 0 && (
                    <div className="text-center w-full py-8 text-muted-foreground">
                      No execution phases defined. Create phases in the campaign setup.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Phase Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Task Progress by Phase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phases.map((phase, i) => {
                  const phaseTasks = getTasksForPhase(phase.id)
                  const completedTasks = phaseTasks.filter(t => t.status === 'completed').length
                  const progress = phaseTasks.length > 0
                    ? (completedTasks / phaseTasks.length) * 100
                    : 0
                return (
                  <div key={phase.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {phase.phase_number || i + 1}. {phase.phase_name}
                      </span>
                      <div className="flex items-center gap-2">
                        {phase.drift_days !== 0 && phase.status === 'completed' && (
                          <Badge variant={phase.drift_days > 0 ? 'destructive' : phase.drift_days < 0 ? 'success' : 'default'}>
                            {phase.drift_days > 0 ? '+' : ''}{phase.drift_days}d
                          </Badge>
                        )}
                        {getPhaseStatusBadge(phase.status)}
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
          </TabsContent>

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
                <p className="text-xs text-muted-foreground mt-1">Within ±1 day</p>
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
                const positiveCount = SEEDED_DRIFT_EVENTS.filter((e) => e.drift_type === 'positive').length
                const negativeCount = SEEDED_DRIFT_EVENTS.filter((e) => e.drift_type === 'negative').length
                const neutralCount = SEEDED_DRIFT_EVENTS.filter((e) => e.drift_type === 'neutral').length
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Summary:</span>
                    <Badge variant="outline" className="bg-expedition-evergreen/10 text-expedition-evergreen border-expedition-evergreen/40">
                      🟢 {positiveCount} Positive
                    </Badge>
                    <Badge variant="outline" className="bg-expedition-checkpoint/10 text-expedition-checkpoint border-expedition-checkpoint/40">
                      🔴 {negativeCount} Negative
                    </Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      ⚪ {neutralCount} Neutral
                    </Badge>
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
                  🟢 Positive
                </Button>
                <Button
                  size="sm"
                  variant={driftFilter === 'negative' ? 'default' : 'outline'}
                  className={driftFilter === 'negative' ? 'bg-expedition-checkpoint hover:bg-expedition-checkpoint/90' : ''}
                  onClick={() => setDriftFilter('negative')}
                >
                  🔴 Negative
                </Button>
                <Button
                  size="sm"
                  variant={driftFilter === 'neutral' ? 'default' : 'outline'}
                  className={driftFilter === 'neutral' ? 'bg-expedition-slate hover:bg-expedition-slate/90' : ''}
                  onClick={() => setDriftFilter('neutral')}
                >
                  ⚪ Neutral
                </Button>
              </div>

              <div className="space-y-4">
                {(driftEvents.length > 0 ? driftEvents : SEEDED_DRIFT_EVENTS).filter(
                  (event) => driftFilter === 'all' || event.drift_type === driftFilter
                ).map((event, idx) => {
                  const isPositive = event.drift_type === 'positive'
                  const isNegative = event.drift_type === 'negative'
                  const isNeutral = event.drift_type === 'neutral'
                  const cardBorder = isPositive
                    ? 'border-expedition-evergreen/40 bg-expedition-evergreen/10'
                    : isNegative
                      ? 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10'
                      : 'border-border bg-muted/50'
                  return (
                    <div key={idx} className={cn('border-2 rounded-lg p-4 space-y-3', cardBorder)}>
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
                            <p className="font-semibold text-sm">{event.phase_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Planned: {event.planned_duration}d | Actual: {event.actual_duration}d
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={isNegative ? 'destructive' : isPositive ? 'default' : 'secondary'}
                          className={isPositive ? 'bg-expedition-evergreen' : ''}
                        >
                          {event.drift_days > 0 ? '+' : ''}{event.drift_days}d
                          {isPositive && ' 🟢'}
                          {isNegative && ' 🔴'}
                          {isNeutral && ' ⚪'}
                        </Badge>
                      </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Root Cause</span>
                            <p className="font-medium">{event.root_cause}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Attribution</span>
                            <p className="font-medium">{event.attribution}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impact</span>
                            <p className="font-medium">{event.impact_on_timeline}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lesson Learned</span>
                            <p className="font-medium">{event.lesson_learned}</p>
                          </div>
                        </div>

                      {event.actionable_insight && (
                        <div className="bg-expedition-trail/10 p-3 rounded-lg border border-expedition-trail/20">
                          <p className="text-sm">
                            <Zap className="w-4 h-4 inline mr-1 text-expedition-trail" />
                            <span className="font-medium text-expedition-navy dark:text-white">Insight:</span>{' '}
                            <span className="text-foreground">{event.actionable_insight}</span>
                          </p>
                        </div>
                      )}

                      {/* Save as Template - positive drift only */}
                      {isPositive && (
                        <div className="bg-expedition-evergreen/10 p-3 rounded-lg border border-expedition-evergreen/20">
                          <p className="text-sm">
                            <TrendingUp className="w-4 h-4 inline mr-1 text-expedition-evergreen" />
                            <span className="font-medium text-expedition-evergreen">💡 Success Pattern Detected</span>
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

        {/* Accountability Timeline Tab */}
        <TabsContent value="accountability" className="space-y-4">
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
                const event = saveTemplateEventIndex != null ? SEEDED_DRIFT_EVENTS[saveTemplateEventIndex] : null
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
  )
}
