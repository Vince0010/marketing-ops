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
  Clock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Zap,
  Target,
  DollarSign,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { DriftEvent } from '@/types/phase'

import KanbanBoard from '@/components/kanban/KanbanBoard'
import { usePhaseTracking } from '@/hooks/usePhaseTracking'
import { useCampaignExecution } from '@/hooks/useCampaignExecution'
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
  const [loading, setLoading] = useState(true)

  // Use unified campaign execution hook (shares data with KanbanBoard)
  const {
    phases: executionPhases,
    tasks: executionTasks,
    history: executionHistory,
    loading: executionLoading,
    error: executionError,
    createTask,
    moveTaskToPhase,
    refetch: executionRefetch,
  } = useCampaignExecution(id)

  // Use unified phase tracking hook for metrics
  // Pass execution data to share state - enables real-time updates when tasks move
  const {
    phaseMetrics,
    operationsHealth,
    tasksInPhase,
    isLoading: trackingLoading,
    error: trackingError,
  } = usePhaseTracking(id, {
    phases: executionPhases,
    tasks: executionTasks,
    history: executionHistory
  })

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) setCampaign(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get phase color based on health
  const getPhaseHealthColor = (phaseId: string): string => {
    const metrics = phaseMetrics.get(phaseId)
    if (!metrics) return 'border-gray-200 bg-white'

    if (metrics.onTimePercentage >= 80) return 'border-green-300 bg-green-50'
    if (metrics.onTimePercentage >= 50) return 'border-yellow-300 bg-yellow-50'
    return 'border-red-300 bg-red-50'
  }

  const totalDrift = Array.from(phaseMetrics.values()).reduce(
    (acc, m) => acc + m.totalDriftDays,
    0
  )

  if (loading || trackingLoading || executionLoading) {
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => executionRefetch()}
            disabled={trackingLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${trackingLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="default" className="gap-2 bg-blue-600">
            <Activity className="w-4 h-4" />
            In Progress
          </Badge>
        </div>
      </div>

      {/* Tracking Error Alert */}
      {trackingError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {trackingError}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => executionRefetch()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operations Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${operationsHealth.status === 'excellent' || operationsHealth.status === 'good'
                ? 'text-green-600'
                : operationsHealth.status === 'fair'
                  ? 'text-yellow-600'
                  : 'text-red-600'
                }`}>
                {operationsHealth.score}%
              </span>
              <TrendingUp className={`w-5 h-5 ${operationsHealth.status === 'excellent' || operationsHealth.status === 'good'
                ? 'text-green-600'
                : 'text-yellow-600'
                }`} />
            </div>
            <Progress value={operationsHealth.score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 capitalize">
              {operationsHealth.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${(campaign?.performance_health ?? 72) >= 80
                ? 'text-green-600'
                : (campaign?.performance_health ?? 72) >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
                }`}>
                {campaign?.performance_health ?? 72}%
              </span>
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <Progress value={campaign?.performance_health ?? 72} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Timeline Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl font-bold ${totalDrift > 0 ? 'text-red-600' : totalDrift < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                {totalDrift > 0 ? '+' : ''}{totalDrift.toFixed(1)}d
              </span>
              {totalDrift > 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {executionTasks.filter((t) => t.status === 'completed').length}/{executionTasks.length} tasks complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Task Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executionTasks.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">
                {Array.from(phaseMetrics.values()).reduce((sum, m) => sum + m.onTimeCount, 0)} on-time
              </span>
              <span className="text-xs text-red-600">
                {Array.from(phaseMetrics.values()).reduce((sum, m) => sum + m.overdueCount, 0)} overdue
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="execution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        {/* Unified Execution Tab - Timeline + Kanban */}
        <TabsContent value="execution" className="space-y-6">
          {/* Debug Info */}
          {executionTasks.length === 0 && executionPhases.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tasks found. Create tasks using the "New Action" button below, then drag them to phases.
              </AlertDescription>
            </Alert>
          )}

          {/* Phase Performance Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Phase Performance Timeline</CardTitle>
                  <CardDescription>
                    Task flow through execution phases — real-time metrics from actual task times
                  </CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  {executionTasks.length} tasks | Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Horizontal scroll container */}
              <div className="flex gap-4 overflow-x-auto pb-4">
                {executionPhases.map((phase, i) => {
                  const metrics = phaseMetrics.get(phase.id)
                  const activeTasks = tasksInPhase.get(phase.id) || []

                  return (
                    <div key={phase.id} className="flex items-center">
                      <Card className={`min-w-[260px] border-2 ${getPhaseHealthColor(phase.id)}`}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Phase {phase.phase_number || i + 1}
                            </Badge>
                            <Badge className={
                              metrics && metrics.onTimePercentage >= 80
                                ? 'bg-green-600'
                                : metrics && metrics.onTimePercentage >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                            }>
                              {metrics ? `${metrics.onTimePercentage.toFixed(0)}% on-time` : 'No data'}
                            </Badge>
                          </div>

                          <h4 className="font-semibold text-sm">{phase.phase_name}</h4>

                          <div className="space-y-2 text-xs">
                            {/* Expected duration */}
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Expected per task:</span>
                              <span className="font-medium">{phase.planned_duration_days}d</span>
                            </div>

                            {/* Active tasks */}
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Currently here:</span>
                              <span className="font-semibold text-blue-600">
                                {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Completed tasks */}
                            {metrics && metrics.totalTasksCompleted > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Completed:</span>
                                <span className="font-medium text-green-600">
                                  {metrics.totalTasksCompleted} task{metrics.totalTasksCompleted !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}

                            {/* Average time */}
                            {metrics && metrics.avgTimeSpentDays > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Avg time spent:</span>
                                <span className={`font-medium ${metrics.avgDriftDays > 0.5 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                  {metrics.avgTimeSpentDays.toFixed(1)}d
                                </span>
                              </div>
                            )}

                            {/* Aggregate drift */}
                            {metrics && metrics.totalDriftDays !== 0 && (
                              <div className="flex items-center gap-1 pt-2 border-t">
                                {metrics.totalDriftDays > 0 ? (
                                  <ArrowUp className="w-3 h-3 text-red-600" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-green-600" />
                                )}
                                <span className={`text-xs font-semibold ${metrics.totalDriftDays > 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                  {Math.abs(metrics.totalDriftDays).toFixed(1)}d aggregate drift
                                </span>
                              </div>
                            )}

                            {/* Performance breakdown */}
                            {metrics && (metrics.totalTasksCompleted + metrics.totalTasksActive) > 0 && (
                              <div className="pt-2 border-t space-y-1">
                                <div className="flex justify-between text-green-600">
                                  <span>On-time:</span>
                                  <span className="font-medium">{metrics.onTimeCount}</span>
                                </div>
                                {metrics.atRiskCount > 0 && (
                                  <div className="flex justify-between text-yellow-600">
                                    <span>At-risk:</span>
                                    <span className="font-medium">{metrics.atRiskCount}</span>
                                  </div>
                                )}
                                {metrics.overdueCount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Overdue:</span>
                                    <span className="font-medium">{metrics.overdueCount}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Connector arrow */}
                      {i < executionPhases.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-muted-foreground mx-1 shrink-0" />
                      )}
                    </div>
                  )
                })}

                {executionPhases.length === 0 && (
                  <div className="text-center w-full py-8 text-muted-foreground">
                    No execution phases defined. Create phases in the campaign setup.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operations Health Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Operations Health Breakdown</CardTitle>
              <CardDescription>Real-time health calculated from task flow efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Flow Velocity</div>
                  <div className="text-2xl font-bold">{operationsHealth.factors.flowVelocity}%</div>
                  <Progress value={operationsHealth.factors.flowVelocity} className="h-2" />
                  <p className="text-xs text-muted-foreground">Task speed vs expected</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Bottleneck Score</div>
                  <div className="text-2xl font-bold">{operationsHealth.factors.bottleneckScore}%</div>
                  <Progress value={operationsHealth.factors.bottleneckScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">Tasks not stuck</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                  <div className="text-2xl font-bold">{operationsHealth.factors.completionRate}%</div>
                  <Progress value={operationsHealth.factors.completionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">Tasks completed</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">On-Time Rate</div>
                  <div className="text-2xl font-bold">{operationsHealth.factors.onTimeRate}%</div>
                  <Progress value={operationsHealth.factors.onTimeRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">Within expected time</p>
                </div>
              </div>

              {operationsHealth.insights.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Insights</p>
                  <ul className="space-y-1">
                    {operationsHealth.insights.map((insight, i) => (
                      <li key={i} className="text-sm text-blue-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Kanban Board */}
          <Card>
            <CardHeader>
              <CardTitle>Task Flow Board</CardTitle>
              <CardDescription>
                Drag tasks through phases — time tracking happens automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KanbanBoard
                campaignId={id!}
                externalData={{
                  phases: executionPhases,
                  tasks: executionTasks,
                  history: executionHistory,
                  loading: executionLoading,
                  error: executionError,
                  createTask,
                  moveTaskToPhase,
                  refetch: executionRefetch
                }}
              />
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
