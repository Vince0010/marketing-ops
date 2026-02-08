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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  DollarSign,
  Target,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { StakeholderAction } from '@/types/database'
import { formatDate } from '@/utils/formatting'
import AIRecommendationsEngine from '@/components/ai/AIRecommendationsEngine'
import StrategicFailureDiagnosis from '@/components/diagnosis/StrategicFailureDiagnosis'
import MetaAdsDashboard from '@/components/meta/MetaAdsDashboard'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'
import { cn } from '@/lib/utils'
import { saveTemplate } from '@/lib/templates'

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

// Recommendation tier: Immediate (critical) | Tactical (DeepSeek) | Strategic (long-term)
type RecommendationTier = 'immediate' | 'tactical' | 'strategic'

interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  category: string
  tier: RecommendationTier
  icon: React.ReactNode
}

const AI_RECOMMENDATIONS: Recommendation[] = [
  // Immediate - critical fixes, risk mitigation
  {
    title: 'Pause underperforming ad set',
    description: 'Ad set "Brand A - Broad" has CTR below 0.5%. Pause to reduce wasted spend immediately.',
    impact: 'high',
    effort: 'low',
    category: 'Performance',
    tier: 'immediate',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    title: 'Fix conversion tracking gap',
    description: 'Last 24h conversions not firing. Check Meta Pixel and CAPI connection to avoid misreported ROAS.',
    impact: 'high',
    effort: 'low',
    category: 'Tracking',
    tier: 'immediate',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    title: 'Increase budget for top-performing channel',
    description: 'Google Ads is outperforming by 40%. Reallocate 15% budget from underperforming channels.',
    impact: 'high',
    effort: 'low',
    category: 'Budget',
    tier: 'tactical',
    icon: <DollarSign className="w-4 h-4" />,
  },
  {
    title: 'Adjust creative rotation schedule',
    description: 'Ad fatigue detected on Variant A. Recommend rotating in new creatives within 48 hours.',
    impact: 'medium',
    effort: 'medium',
    category: 'Creative',
    tier: 'tactical',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    title: 'Extend optimization phase by 3 days',
    description: 'Current ROAS trend suggests additional optimization could yield 0.5x improvement.',
    impact: 'high',
    effort: 'low',
    category: 'Timeline',
    tier: 'tactical',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    title: 'Target audience refinement',
    description: 'Segment B (25-34, urban) converting 2.3x better. Narrow targeting to this cohort. Powered by DeepSeek analysis.',
    impact: 'high',
    effort: 'medium',
    category: 'Targeting',
    tier: 'tactical',
    icon: <Target className="w-4 h-4" />,
  },
  {
    title: 'A/B test headline variants',
    description: 'Run 2 headline variants for 1 week; current winner has +12% CTR in similar campaigns.',
    impact: 'medium',
    effort: 'medium',
    category: 'Creative',
    tier: 'tactical',
    icon: <Zap className="w-4 h-4" />,
  },
  // Strategic - process, team, templates
  {
    title: 'Create campaign template from this setup',
    description: 'This structure (phases, audiences, channels) could be reused. Save as template for future launches.',
    impact: 'high',
    effort: 'low',
    category: 'Process',
    tier: 'strategic',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    title: 'Review team capacity for next quarter',
    description: 'Current utilization suggests adding capacity for Q2 campaigns. Consider contractor or reallocation.',
    impact: 'medium',
    effort: 'high',
    category: 'Team',
    tier: 'strategic',
    icon: <Target className="w-4 h-4" />,
  },
  {
    title: 'Standardize approval cycle',
    description: 'Reduce client delay by defining a 48h SLA for creative approval in campaign briefs.',
    impact: 'high',
    effort: 'medium',
    category: 'Process',
    tier: 'strategic',
    icon: <Clock className="w-4 h-4" />,
  },
]

type RecommendationActionState = 'pending' | 'accepted' | 'rejected' | 'completed'
type DriftFilterValue = 'all' | 'positive' | 'negative' | 'neutral'

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([])
  const [stakeholderActions, setStakeholderActions] = useState<StakeholderAction[]>([])
  const [loading, setLoading] = useState(true)
  // Recommendation action tracking (key = `${tier}-${index}`)
  const [recommendationStates, setRecommendationStates] = useState<Record<string, RecommendationActionState>>({})
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  // Drift classification filter
  const [driftFilter, setDriftFilter] = useState<DriftFilterValue>('all')
  // Save as Template (positive drift)
  const [saveTemplateEventIndex, setSaveTemplateEventIndex] = useState<number | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Campaign Execution Tracker</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {campaign?.gate_overridden && (
            <ObservationModeBadge
              riskScore={campaign.risk_score}
              campaignStatus={campaign?.status}
            />
          )}
          <Badge variant="default" className="gap-2 bg-blue-600">
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
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      🟢 {positiveCount} Positive
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      🔴 {negativeCount} Negative
                    </Badge>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
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
                  className={driftFilter === 'positive' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setDriftFilter('positive')}
                >
                  🟢 Positive
                </Button>
                <Button
                  size="sm"
                  variant={driftFilter === 'negative' ? 'default' : 'outline'}
                  className={driftFilter === 'negative' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setDriftFilter('negative')}
                >
                  🔴 Negative
                </Button>
                <Button
                  size="sm"
                  variant={driftFilter === 'neutral' ? 'default' : 'outline'}
                  className={driftFilter === 'neutral' ? 'bg-gray-600 hover:bg-gray-700' : ''}
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
                    ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
                    : isNegative
                      ? 'border-red-300 bg-red-50/30 dark:bg-red-950/20'
                      : 'border-gray-200 bg-gray-50/50 dark:bg-gray-900/30'
                  return (
                    <div key={idx} className={cn('border-2 rounded-lg p-4 space-y-3', cardBorder)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isNegative ? (
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            </div>
                          ) : isPositive ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-gray-600" />
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
                          className={isPositive ? 'bg-green-600' : ''}
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
                          <p className="font-medium">{event.root_cause || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Attribution</span>
                          <p className="font-medium">{event.attribution || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact</span>
                          <p className="font-medium">{event.impact_on_timeline || 'Timeline adjustment'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lesson Learned</span>
                          <p className="font-medium">{event.lesson_learned || 'N/A'}</p>
                        </div>
                      </div>

                      {event.actionable_insight && (
                        <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-950/30">
                          <p className="text-sm">
                            <Zap className="w-4 h-4 inline mr-1 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-300">Insight:</span>{' '}
                            <span className="text-blue-700 dark:text-blue-200">{event.actionable_insight}</span>
                          </p>
                        </div>
                      )}

                      {/* Save as Template - positive drift only */}
                      {isPositive && (
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

        {/* Accountability Tab */}
        <TabsContent value="accountability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Actionable suggestions by tier: Immediate (critical), Tactical (DeepSeek), Strategic (long-term)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="tactical" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="immediate" className="gap-1.5 text-xs sm:text-sm">
                    <span aria-hidden>🔥</span>
                    Immediate
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                      {AI_RECOMMENDATIONS.filter((r) => r.tier === 'immediate').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="tactical" className="gap-1.5 text-xs sm:text-sm">
                    <span aria-hidden>🎯</span>
                    Tactical
                    <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-blue-600">
                      {AI_RECOMMENDATIONS.filter((r) => r.tier === 'tactical').length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="strategic" className="gap-1.5 text-xs sm:text-sm">
                    <span aria-hidden>🚀</span>
                    Strategic
                    <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-purple-600">
                      {AI_RECOMMENDATIONS.filter((r) => r.tier === 'strategic').length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {(['immediate', 'tactical', 'strategic'] as const).map((tier) => {
                  const tierConfig = {
                    immediate: {
                      label: 'Immediate',
                      emoji: '🔥',
                      badgeClass: 'border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400',
                    },
                    tactical: {
                      label: 'Tactical',
                      emoji: '🎯',
                      badgeClass: 'border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
                    },
                    strategic: {
                      label: 'Strategic',
                      emoji: '🚀',
                      badgeClass: 'border-purple-300 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400',
                    },
                  }[tier]
                  const recs = AI_RECOMMENDATIONS.filter((r) => r.tier === tier)
                  return (
                    <TabsContent key={tier} value={tier} className="space-y-4 mt-4">
                      {recs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          No {tierConfig.label.toLowerCase()} recommendations right now.
                        </p>
                      ) : (
                        recs.map((rec, i) => {
                          const recKey = `${tier}-${i}`
                          const actionState = recommendationStates[recKey] ?? 'pending'
                          const rejectReason = rejectReasons[recKey] ?? ''
                          return (
                            <div
                              key={i}
                              className={cn(
                                'rounded-lg p-4 space-y-3 border-2 transition-colors',
                                actionState === 'accepted' && 'border-green-400 bg-green-50/50 dark:bg-green-950/20',
                                actionState === 'rejected' && 'border-gray-200 bg-gray-50/80 dark:bg-gray-900/50 opacity-80',
                                actionState === 'completed' && 'border-green-300 bg-green-50/30 dark:bg-green-950/10',
                                actionState === 'pending' && 'border-border'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {actionState === 'completed' ? (
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                      {rec.icon}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={cn('text-xs shrink-0', tierConfig.badgeClass)}
                                      >
                                        {tierConfig.emoji} {tierConfig.label}
                                      </Badge>
                                      {actionState !== 'pending' && (
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'text-xs',
                                            actionState === 'accepted' && 'border-green-500 bg-green-100 text-green-800',
                                            actionState === 'rejected' && 'border-gray-400 bg-gray-100 text-gray-700',
                                            actionState === 'completed' && 'border-green-600 bg-green-100 text-green-800'
                                          )}
                                        >
                                          {actionState === 'accepted' && 'In Progress'}
                                          {actionState === 'rejected' && 'Rejected'}
                                          {actionState === 'completed' && 'Completed'}
                                        </Badge>
                                      )}
                                      <p className="font-semibold text-sm">{rec.title}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>
                                    {actionState === 'rejected' && rejectReason && (
                                      <p className="text-xs text-muted-foreground mt-1 italic">Reason: {rejectReason}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
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
                                {actionState === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => setRecommendationStates((s) => ({ ...s, [recKey]: 'accepted' }))}
                                    >
                                      Accept
                                    </Button>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          Reject
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80" align="end">
                                        <div className="space-y-2">
                                          <Label className="text-xs">Reason (optional)</Label>
                                          <Textarea
                                            placeholder="Why not implementing..."
                                            rows={2}
                                            value={rejectReason}
                                            onChange={(e) => setRejectReasons((r) => ({ ...r, [recKey]: e.target.value }))}
                                            className="text-sm"
                                          />
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => {
                                              setRecommendationStates((s) => ({ ...s, [recKey]: 'rejected' }))
                                            }}
                                          >
                                            Confirm Reject
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                )}
                                {actionState === 'accepted' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 gap-1"
                                    onClick={() => setRecommendationStates((s) => ({ ...s, [recKey]: 'completed' }))}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
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
              className="bg-green-600 hover:bg-green-700 gap-1.5"
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
