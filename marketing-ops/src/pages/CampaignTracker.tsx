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
  History,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isSimulateId, loadSimulatePayload, saveSimulatePayload, type PhaseStatusChange } from '@/lib/simulate'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent, PhaseTicket } from '@/types/phase'
import { formatDate } from '@/utils/formatting'
import TrackerTimeline from '@/components/tracker/TrackerTimeline'
import TrackerCalendar from '@/components/tracker/TrackerCalendar'

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
  const [statusChanges, setStatusChanges] = useState<PhaseStatusChange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      if (id && isSimulateId(id)) {
        const payload = loadSimulatePayload()
        if (payload?.campaign) setCampaign(payload.campaign as Campaign)
        if (payload?.phases?.length) setPhases(payload.phases as ExecutionPhase[])
        setStatusChanges((payload?.status_changes as PhaseStatusChange[]) ?? [])
        setLoading(false)
        return
      }
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
    const phase = phases.find((p) => p.id === phaseId)
    const nextPhases = phases.map((p) =>
      p.id === phaseId ? { ...p, status: 'in_progress' as const, actual_start_date: now } : p
    )
    setPhases(nextPhases)
    if (id && isSimulateId(id)) {
      const payload = loadSimulatePayload()
      if (payload) {
        const change: PhaseStatusChange = {
          phaseId,
          phaseName: phase?.phase_name ?? phaseId,
          from: 'pending',
          to: 'in_progress',
          at: new Date().toISOString(),
        }
        const nextChanges = [...(payload.status_changes ?? []), change]
        setStatusChanges(nextChanges)
        saveSimulatePayload({ ...payload, phases: nextPhases, status_changes: nextChanges })
      }
      return
    }
    try {
      await supabase
        .from('execution_phases')
        .update({ status: 'in_progress', actual_start_date: now })
        .eq('id', phaseId)
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

    const nextPhases = phases.map((p) =>
      p.id === phaseId
        ? {
            ...p,
            status: 'completed' as const,
            actual_end_date: now,
            actual_duration_days: actualDays,
            drift_days: driftDays,
            drift_type: driftType,
          }
        : p
    )
    setPhases(nextPhases)
    if (id && isSimulateId(id)) {
      const payload = loadSimulatePayload()
      if (payload) {
        const change: PhaseStatusChange = {
          phaseId,
          phaseName: phase.phase_name,
          from: 'in_progress',
          to: 'completed',
          at: new Date().toISOString(),
        }
        const nextChanges = [...(payload.status_changes ?? []), change]
        setStatusChanges(nextChanges)
        saveSimulatePayload({ ...payload, phases: nextPhases, status_changes: nextChanges })
      }
      return
    }
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

  const handlePhasesReorder = (reordered: ExecutionPhase[]) => {
    setPhases(reordered)
    if (id && isSimulateId(id)) {
      const payload = loadSimulatePayload()
      if (payload) saveSimulatePayload({ ...payload, phases: reordered })
    }
  }

  const persistPhases = (next: ExecutionPhase[], nextStatusChanges?: PhaseStatusChange[]) => {
    setPhases(next)
    if (nextStatusChanges !== undefined) setStatusChanges(nextStatusChanges)
    if (id && isSimulateId(id)) {
      const payload = loadSimulatePayload()
      if (payload) {
        saveSimulatePayload({
          ...payload,
          phases: next,
          ...(nextStatusChanges !== undefined && { status_changes: nextStatusChanges }),
        })
      }
    }
  }

  const handleAddTicket = (phaseId: string) => {
    const ticket: PhaseTicket = { id: crypto.randomUUID(), title: 'New task' }
    const next = phases.map((p) =>
      p.id === phaseId ? { ...p, tickets: [...(p.tickets ?? []), ticket] } : p
    )
    persistPhases(next)
  }

  const handleMoveTicket = (ticketId: string, fromPhaseId: string, toPhaseId: string, insertIndex?: number) => {
    const fromPhase = phases.find((p) => p.id === fromPhaseId)
    const ticket = fromPhase?.tickets?.find((t) => t.id === ticketId)
    if (!fromPhase || !ticket) return
    const fromTickets = (fromPhase.tickets ?? []).filter((t) => t.id !== ticketId)
    const toPhase = phases.find((p) => p.id === toPhaseId)
    if (!toPhase) return
    const toTickets = [...(toPhase.tickets ?? [])]
    const idx = insertIndex ?? toTickets.length
    toTickets.splice(idx, 0, ticket)
    const next = phases.map((p) => {
      if (p.id === fromPhaseId) return { ...p, tickets: fromTickets }
      if (p.id === toPhaseId) return { ...p, tickets: toTickets }
      return p
    })
    persistPhases(next)
  }

  const handleRemoveTicket = (phaseId: string, ticketId: string) => {
    const next = phases.map((p) =>
      p.id === phaseId ? { ...p, tickets: (p.tickets ?? []).filter((t) => t.id !== ticketId) } : p
    )
    persistPhases(next)
  }

  const handleEditTicket = (phaseId: string, ticketId: string, updates: Partial<PhaseTicket>) => {
    const next = phases.map((p) => {
      if (p.id !== phaseId) return p
      const tickets = (p.tickets ?? []).map((t) =>
        t.id === ticketId ? { ...t, ...updates } : t
      )
      return { ...p, tickets }
    })
    persistPhases(next)
  }

  const handleRevertPhase = (phaseId: string, newStatus: 'pending' | 'in_progress') => {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase || phase.status !== 'completed') return
    const fromStatus = phase.status
    const updated: ExecutionPhase = {
      ...phase,
      status: newStatus,
      actual_end_date: undefined,
      actual_duration_days: undefined,
      drift_days: 0,
      drift_type: undefined,
      drift_reason: undefined,
    }
    if (newStatus === 'pending') {
      updated.actual_start_date = undefined
    }
    const next = phases.map((p) => (p.id === phaseId ? updated : p))
    const change: PhaseStatusChange = {
      phaseId,
      phaseName: phase.phase_name,
      from: fromStatus,
      to: newStatus,
      at: new Date().toISOString(),
    }
    const nextChanges = [...statusChanges, change]
    setStatusChanges(nextChanges)
    persistPhases(next, nextChanges)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {id && isSimulateId(id) && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Simulation mode</AlertTitle>
          <AlertDescription>
            This campaign is simulated (no Supabase). Data is stored in this browser only.
          </AlertDescription>
        </Alert>
      )}
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
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        {/* Execution Timeline Tab - Notion-style draggable board */}
        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phase Timeline</CardTitle>
              <CardDescription>
                Add tickets to stages, drag tickets between phases, and drag phase columns to reorder. Start/Complete updates phase status and drift.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrackerTimeline
                phases={phases}
                onReorder={id && isSimulateId(id) ? handlePhasesReorder : undefined}
                onStartPhase={handleStartPhase}
                onCompletePhase={handleCompletePhase}
                onAddTicket={handleAddTicket}
                onMoveTicket={handleMoveTicket}
                onRemoveTicket={handleRemoveTicket}
                onEditTicket={handleEditTicket}
                onRevertPhase={handleRevertPhase}
                getPhaseStatusColor={getPhaseStatusColor}
                getPhaseStatusBadge={getPhaseStatusBadge}
              />
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

          {/* Phase status changes (audit) */}
          {statusChanges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Phase status changes
                </CardTitle>
                <CardDescription>
                  Log of status transitions for audit and analysis. Reverts and completions update the timeline and drift.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {[...statusChanges].reverse().slice(0, 20).map((c, i) => (
                    <li key={`${c.phaseId}-${c.at}-${i}`} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium">{c.phaseName}</span>
                      <span className="text-muted-foreground">
                        {c.from} → {c.to}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Calendar</CardTitle>
              <CardDescription>
                Phase schedule and milestones. See overlaps and delays at a glance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrackerCalendar
                phases={phases}
                campaignStart={campaign?.start_date}
                campaignEnd={campaign?.end_date}
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
