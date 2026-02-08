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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { StakeholderAction } from '@/types/database'
import { formatDate } from '@/utils/formatting'
import AIRecommendationsEngine from '@/components/ai/AIRecommendationsEngine'
import StrategicFailureDiagnosis from '@/components/diagnosis/StrategicFailureDiagnosis'
import MetaAdsDashboard from '@/components/meta/MetaAdsDashboard'

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([])
  const [stakeholderActions, setStakeholderActions] = useState<StakeholderAction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching data for campaign ID:', id)
      const [campaignRes, phasesRes, driftRes, stakeholderRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('execution_phases').select('*').eq('campaign_id', id).order('phase_number'),
        supabase.from('drift_events').select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
        supabase.from('stakeholder_actions').select('*').eq('campaign_id', id).order('requested_date', { ascending: false }),
      ])

      console.log('Campaign response:', campaignRes)
      console.log('Phases response:', phasesRes)

      if (campaignRes.data) setCampaign(campaignRes.data)
      if (phasesRes.data) setPhases(phasesRes.data)
      if (driftRes.data) setDriftEvents(driftRes.data)
      if (stakeholderRes.data) setStakeholderActions(stakeholderRes.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

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

      // Create drift event if there's significant drift
      if (Math.abs(driftDays) > 0) {
        const driftEventData = {
          campaign_id: campaign?.id || '',
          phase_id: phaseId,
          drift_days: driftDays,
          drift_type: driftType,
          phase_name: phase.phase_name,
          planned_duration: phase.planned_duration_days,
          actual_duration: actualDays,
          reason: driftDays > 0 ? 'Timeline overrun' : 'Completed ahead of schedule',
          impact_description: Math.abs(driftDays) > 2 ? 'Significant impact on subsequent phases' : 'Minor timeline adjustment',
          lesson_learned: driftType === 'positive' ? 'Process optimization identified' : 'Timeline monitoring needed',
          template_created: driftType === 'positive' && Math.abs(driftDays) > 1,
        }

        await supabase.from('drift_events').insert([driftEventData])

        // Refresh drift events to show the new one
        const { data: updatedDriftEvents } = await supabase
          .from('drift_events')
          .select('*')
          .eq('campaign_id', campaign?.id)
          .order('created_at', { ascending: false })
        
        if (updatedDriftEvents) setDriftEvents(updatedDriftEvents)

        // Update campaign drift counters
        const newDriftCount = (campaign?.drift_count || 0) + 1
        const newPositiveDrift = driftType === 'positive' ? (campaign?.positive_drift_count || 0) + 1 : (campaign?.positive_drift_count || 0)
        const newNegativeDrift = driftType === 'negative' ? (campaign?.negative_drift_count || 0) + 1 : (campaign?.negative_drift_count || 0)
        
        await supabase
          .from('campaigns')
          .update({
            drift_count: newDriftCount,
            positive_drift_count: newPositiveDrift,
            negative_drift_count: newNegativeDrift,
          })
          .eq('id', campaign?.id)

        // Update local campaign state
        if (campaign) {
          setCampaign({
            ...campaign,
            drift_count: newDriftCount,
            positive_drift_count: newPositiveDrift,
            negative_drift_count: newNegativeDrift,
          })
        }
      }

      // Update local phase state
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId
            ? {
                ...p,
                status: 'completed',
                actual_end_date: now,
                actual_duration_days: actualDays,
                drift_days: driftDays,
                drift_type: driftType,
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

  const handleSaveAsTemplate = async (driftEvent: DriftEvent) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Demo Mode</h3>
          <p className="text-yellow-700 mb-4">
            This campaign doesn't exist in the database yet. You can:
          </p>
          <ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
            <li>Apply the seed data to your Supabase database</li>
            <li>Create a new campaign from the dashboard</li>
            <li>Check the database connection at <a href="/db-test" className="underline">/db-test</a></li>
          </ul>
          <div className="text-sm text-yellow-600">
            Expected campaign IDs: camp-successful-001, camp-failure-003, camp-accountability-005
          </div>
        </div>
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
            <div className="text-2xl font-bold">{driftEvents.length}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-600">{driftEvents.filter(d => d.drift_type === 'negative').length} delays</span>
              <span className="text-xs text-green-600">{driftEvents.filter(d => d.drift_type === 'positive').length} ahead</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="execution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="execution">Execution Timeline</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="accountability">Accountability</TabsTrigger>
          <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
          <TabsTrigger value="diagnosis">Failure Diagnosis</TabsTrigger>
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

          {/* Drift Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Average Drift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${driftSummary.avgDrift > 0 ? 'text-red-600' : driftSummary.avgDrift < 0 ? 'text-green-600' : 'text-gray-600'}`}>
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
                <div className="text-2xl font-bold text-green-600">{driftSummary.positiveCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Ahead of schedule</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Negative Drifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{driftSummary.negativeCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Behind schedule</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">On Track</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{driftSummary.phasesOnTrack}</div>
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
              <CardDescription>Track deviations from planned timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driftEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Drift Events Yet</h3>
                    <p className="text-gray-500">Drift events will appear here as phases are completed with timeline deviations.</p>
                  </div>
                ) : (
                  driftEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-3">
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
                          <p className="font-medium">{event.root_cause || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact</span>
                          <p className="font-medium">{event.impact_on_timeline || event.impact_description || 'Timeline adjustment'}</p>
                        </div>
                        {event.lesson_learned && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Lesson Learned</span>
                            <p className="font-medium">{event.lesson_learned}</p>
                          </div>
                        )}
                      </div>

                      {event.lesson_learned && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm">
                            <Zap className="w-4 h-4 inline mr-1 text-blue-600" />
                            <span className="font-medium text-blue-800">Insight:</span>{' '}
                            <span className="text-blue-700">{event.lesson_learned}</span>
                          </p>
                        </div>
                      )}

                      {event.drift_type === 'positive' && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm">
                            <TrendingUp className="w-4 h-4 inline mr-1 text-green-600" />
                            <span className="font-medium text-green-800">💡 Success Pattern Detected</span>
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
                  ))
                )}
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
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Stakeholder Actions Yet</h3>
                    <p className="text-gray-500">Stakeholder actions and approvals will be tracked here.</p>
                  </div>
                ) : (
                  stakeholderActions.map((action) => {
                    const isOverdue = action.status === 'overdue' || (action.expected_date && new Date(action.expected_date) < new Date() && action.status !== 'completed')
                    const getActorColor = (type: string) => {
                      switch (type) {
                        case 'client': return 'bg-purple-100 border-purple-200 text-purple-800'
                        case 'agency': return 'bg-blue-100 border-blue-200 text-blue-800'
                        case 'external': return 'bg-gray-100 border-gray-200 text-gray-800'
                        default: return 'bg-gray-100 border-gray-200 text-gray-800'
                      }
                    }

                    return (
                      <div key={action.id} className={`border rounded-lg p-4 space-y-3 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
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
                              <p className="text-xs text-red-600 mt-1">
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
                              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                Critical
                              </Badge>
                            </div>
                          )}
                        </div>

                        {action.delay_reason && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm">
                              <AlertTriangle className="w-4 h-4 inline mr-1 text-yellow-600" />
                              <span className="font-medium text-yellow-800">Delay Reason:</span>{' '}
                              <span className="text-yellow-700">{action.delay_reason}</span>
                            </p>
                            {action.delay_attribution && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Attribution: {action.delay_attribution}
                              </p>
                            )}
                          </div>
                        )}

                        {action.delay_impact && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium text-red-800">Impact:</span>{' '}
                              <span className="text-red-700">{action.delay_impact}</span>
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

        {/* Meta Ads Dashboard Tab */}
        <TabsContent value="meta-ads" className="space-y-4">
          {campaign && (
            <MetaAdsDashboard
              campaign={campaign}
              metaPixelId={campaign.meta_pixel_id}
              metaAccountId={campaign.meta_ads_account_id}
            />
          )}
        </TabsContent>

        {/* Strategic Failure Diagnosis Tab */}
        <TabsContent value="diagnosis" className="space-y-4">
          {campaign && (
            <StrategicFailureDiagnosis
              campaign={campaign}
              phases={phases}
              driftEvents={driftEvents}
              onCreateTemplate={(diagnosis) => {
                console.log('Created failure prevention template:', diagnosis)
                // In production, this would save the template to the database
              }}
            />
          )}
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {campaign && (
            <AIRecommendationsEngine
              campaign={campaign}
              phases={phases}
              driftEvents={driftEvents}
              onApplyRecommendation={(recommendation) => {
                console.log('Applied recommendation:', recommendation)
                // In production, this would trigger actual campaign modifications
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
