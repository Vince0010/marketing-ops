import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  Minus,
  Zap,
  Target,
  DollarSign,
  BarChart3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import { formatDate } from '@/utils/formatting'

// Seeded drift events for demo
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
]

// Seeded AI recommendations
const AI_RECOMMENDATIONS = [
  {
    title: 'Increase budget for top-performing channel',
    description: 'Google Ads is outperforming by 40%. Reallocate 15% budget from underperforming channels.',
    impact: 'high',
    effort: 'low',
    category: 'Budget',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    title: 'Adjust creative rotation schedule',
    description: 'Ad fatigue detected on Variant A. Recommend rotating in new creatives within 48 hours.',
    impact: 'medium',
    effort: 'medium',
    category: 'Creative',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    title: 'Extend optimization phase by 3 days',
    description: 'Current ROAS trend suggests additional optimization could yield 0.5x improvement.',
    impact: 'high',
    effort: 'low',
    category: 'Timeline',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    title: 'Target audience refinement',
    description: 'Segment B (25-34, urban) converting 2.3x better. Narrow targeting to this cohort.',
    impact: 'high',
    effort: 'medium',
    category: 'Targeting',
    icon: <Target className="w-4 h-4" />,
  },
]

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [campaignRes, phasesRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('execution_phases').select('*').eq('campaign_id', id).order('phase_number'),
      ])

      if (campaignRes.data) setCampaign(campaignRes.data)
      if (phasesRes.data) setPhases(phasesRes.data)
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

      // Update local state
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId ? { ...p, status: 'in_progress', actual_start_date: now } : p
        )
      )
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

    try {
      await supabase
        .from('execution_phases')
        .update({
          status: 'completed',
          actual_end_date: now,
          actual_duration_days: actualDays,
          drift_days: driftDays,
          drift_type: driftDays > 1 ? 'negative' : driftDays < -1 ? 'positive' : 'neutral',
        })
        .eq('id', phaseId)

      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId
            ? {
                ...p,
                status: 'completed',
                actual_end_date: now,
                actual_duration_days: actualDays,
                drift_days: driftDays,
                drift_type: driftDays > 1 ? 'negative' : driftDays < -1 ? 'positive' : 'neutral',
              }
            : p
        )
      )
    } catch (error) {
      console.error('Error completing phase:', error)
    }
  }

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-green-50'
      case 'in_progress':
        return 'border-blue-300 bg-blue-50'
      case 'blocked':
        return 'border-red-300 bg-red-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getPhaseStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-600">In Progress</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const operationalHealth = campaign?.operational_health ?? 85
  const performanceHealth = campaign?.performance_health ?? 72
  const totalDrift = phases.reduce((acc, p) => acc + (p.drift_days || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Execution Tracker</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
        <Badge variant="default" className="gap-2 bg-blue-600">
          <Activity className="w-4 h-4" />
          In Progress
        </Badge>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operational Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${operationalHealth >= 80 ? 'text-green-600' : operationalHealth >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {operationalHealth}%
              </span>
              <TrendingUp className={`w-5 h-5 ${operationalHealth >= 80 ? 'text-green-600' : 'text-yellow-600'}`} />
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
              <span className={`text-2xl font-bold ${performanceHealth >= 80 ? 'text-green-600' : performanceHealth >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {performanceHealth}%
              </span>
              <BarChart3 className="w-5 h-5 text-yellow-600" />
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
              <span className={`text-2xl font-bold ${totalDrift > 0 ? 'text-red-600' : totalDrift < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {totalDrift > 0 ? '+' : ''}{totalDrift}d
              </span>
              {totalDrift > 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
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
            <div className="text-2xl font-bold">{SEEDED_DRIFT_EVENTS.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-600">{SEEDED_DRIFT_EVENTS.filter(d => d.drift_type === 'negative').length} delays</span>
              <span className="text-xs text-green-600">{SEEDED_DRIFT_EVENTS.filter(d => d.drift_type === 'positive').length} ahead</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="execution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="execution">Execution Timeline</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        {/* Execution Timeline Tab */}
        <TabsContent value="execution" className="space-y-4">
          {/* Horizontal Timeline View */}
          <Card>
            <CardHeader>
              <CardTitle>Phase Timeline</CardTitle>
              <CardDescription>Click a phase to start or complete it</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Horizontal scroll container */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {phases.map((phase, i) => (
                  <div key={phase.id} className="flex items-center">
                    <Card className={`min-w-[220px] border-2 ${getPhaseStatusColor(phase.status)}`}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Phase {phase.phase_number || i + 1}
                          </Badge>
                          {getPhaseStatusBadge(phase.status)}
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
                              <span className={phase.drift_days > 0 ? 'text-red-600 font-semibold' : phase.drift_days < 0 ? 'text-green-600 font-semibold' : ''}>
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
                          <div className={`flex items-center gap-1 text-xs font-semibold ${phase.drift_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
                            className="w-full gap-1 border-green-300 text-green-700 hover:bg-green-50"
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
                ))}

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
              <CardTitle>Phase Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.map((phase, i) => {
                const progress =
                  phase.status === 'completed'
                    ? 100
                    : phase.status === 'in_progress'
                    ? 50
                    : 0
                return (
                  <div key={phase.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {phase.phase_number || i + 1}. {phase.phase_name}
                      </span>
                      <div className="flex items-center gap-2">
                        {phase.drift_days !== 0 && phase.status === 'completed' && (
                          <Badge variant={phase.drift_days > 0 ? 'destructive' : 'default'} className={phase.drift_days < 0 ? 'bg-green-600' : ''}>
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
        <TabsContent value="drift" className="space-y-4">
          {totalDrift > 2 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Significant Timeline Drift</AlertTitle>
              <AlertDescription>
                Total drift of +{totalDrift} days detected. Review root causes below and consider timeline adjustment.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Drift Events</CardTitle>
              <CardDescription>Track deviations from planned timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SEEDED_DRIFT_EVENTS.map((event, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {event.drift_type === 'negative' ? (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <ArrowUp className="w-4 h-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowDown className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">{event.phase_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Planned: {event.planned_duration}d | Actual: {event.actual_duration}d
                          </p>
                        </div>
                      </div>
                      <Badge variant={event.drift_type === 'negative' ? 'destructive' : 'default'} className={event.drift_type === 'positive' ? 'bg-green-600' : ''}>
                        {event.drift_days > 0 ? '+' : ''}{event.drift_days}d
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
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm">
                          <Zap className="w-4 h-4 inline mr-1 text-blue-600" />
                          <span className="font-medium text-blue-800">Insight:</span>{' '}
                          <span className="text-blue-700">{event.actionable_insight}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>
                Actionable suggestions based on campaign performance and drift analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AI_RECOMMENDATIONS.map((rec, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {rec.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{rec.title}</p>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {rec.category}
                    </Badge>
                    <Badge
                      variant={rec.impact === 'high' ? 'default' : 'secondary'}
                      className={rec.impact === 'high' ? 'bg-green-600' : ''}
                    >
                      {rec.impact} impact
                    </Badge>
                    <Badge
                      variant={rec.effort === 'low' ? 'default' : 'secondary'}
                      className={rec.effort === 'low' ? 'bg-blue-600' : ''}
                    >
                      {rec.effort} effort
                    </Badge>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
