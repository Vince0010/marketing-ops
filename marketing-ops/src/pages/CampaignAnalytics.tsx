import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileX,
  Target,
  Lightbulb,
  MapPin,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import type { PerformanceMetric, StakeholderAction } from '@/types/database'
import { formatCurrency } from '@/utils/formatting'
import { DemographicAlignmentTracker } from '@/components/demographics/DemographicAlignmentTracker'

// Seeded phase drift data for BarChart
const PHASE_DRIFT_DATA = [
  { name: 'Planning', planned: 3, actual: 3, drift: 0 },
  { name: 'Creative', planned: 5, actual: 8, drift: 3 },
  { name: 'Compliance', planned: 2, actual: 4, drift: 2 },
  { name: 'Setup', planned: 3, actual: 2, drift: -1 },
  { name: 'Launch', planned: 1, actual: 1, drift: 0 },
  { name: 'Optimization', planned: 7, actual: 9, drift: 2 },
  { name: 'Reporting', planned: 2, actual: 2, drift: 0 },
]

// Seeded ROAS trend data for LineChart
const ROAS_TREND_DATA = [
  { day: 'Day 1', roas: 0.8, target: 2.5, spend: 1200 },
  { day: 'Day 3', roas: 1.2, target: 2.5, spend: 3600 },
  { day: 'Day 5', roas: 1.8, target: 2.5, spend: 6000 },
  { day: 'Day 7', roas: 2.1, target: 2.5, spend: 8400 },
  { day: 'Day 10', roas: 2.4, target: 2.5, spend: 12000 },
  { day: 'Day 14', roas: 2.8, target: 2.5, spend: 16800 },
  { day: 'Day 18', roas: 3.0, target: 2.5, spend: 21600 },
  { day: 'Day 21', roas: 3.1, target: 2.5, spend: 25200 },
  { day: 'Day 25', roas: 3.2, target: 2.5, spend: 30000 },
  { day: 'Day 28', roas: 3.2, target: 2.5, spend: 33600 },
  { day: 'Day 30', roas: 3.2, target: 2.5, spend: 36000 },
]

// Seeded accountability log
const ACCOUNTABILITY_LOG = [
  {
    date: '2026-01-15',
    actor: 'Sarah Johnson',
    actorType: 'manager' as const,
    action: 'Approved campaign launch',
    impact: 'Campaign started on schedule',
    sentiment: 'positive' as const,
  },
  {
    date: '2026-01-18',
    actor: 'Mike Chen',
    actorType: 'creative' as const,
    action: 'Requested additional design revisions',
    impact: 'Creative phase extended by 3 days',
    sentiment: 'negative' as const,
  },
  {
    date: '2026-01-20',
    actor: 'Legal Team',
    actorType: 'compliance' as const,
    action: 'Flagged ad copy for regulatory review',
    impact: 'Compliance review extended by 2 days',
    sentiment: 'negative' as const,
  },
  {
    date: '2026-01-22',
    actor: 'Emily Davis',
    actorType: 'analyst' as const,
    action: 'Reused campaign template for faster setup',
    impact: 'Setup completed 1 day early',
    sentiment: 'positive' as const,
  },
  {
    date: '2026-01-28',
    actor: 'Tom Wilson',
    actorType: 'specialist' as const,
    action: 'Reallocated budget to top-performing channel',
    impact: 'ROAS improved by 0.4x',
    sentiment: 'positive' as const,
  },
  {
    date: '2026-02-01',
    actor: 'Sarah Johnson',
    actorType: 'manager' as const,
    action: 'Extended optimization phase by 2 days',
    impact: 'Additional spend of $2,400 for better returns',
    sentiment: 'neutral' as const,
  },
]

const CHANNEL_DATA = [
  { channel: 'Google Ads', spend: 18500, revenue: 70300, roas: 3.8, conversions: 520, ctr: 3.2 },
  { channel: 'Facebook Ads', spend: 15200, revenue: 44080, roas: 2.9, conversions: 410, ctr: 2.5 },
  { channel: 'LinkedIn Ads', spend: 11531, revenue: 31134, roas: 2.7, conversions: 304, ctr: 2.1 },
]

// --- Audience Insights (demographic analysis) seeded data ---
const PLANNED_AGE_DATA = [
  { range: '18-24', goal: 25, actual: 3, diff: -22 },
  { range: '25-34', goal: 35, actual: 50, diff: 15 },
  { range: '35-44', goal: 25, actual: 28, diff: 3 },
  { range: '45-54', goal: 10, actual: 14, diff: 4 },
  { range: '55+', goal: 5, actual: 5, diff: 0 },
]

const PLANNED_GENDER_DATA = [
  { segment: 'Female', goal: 50, actual: 62, diff: 12, status: 'over' as const },
  { segment: 'Male', goal: 48, actual: 35, diff: -13, status: 'under' as const },
  { segment: 'Other', goal: 2, actual: 3, diff: 1, status: 'over' as const },
]

const PLANNED_LOCATIONS = [
  { location: 'Northeast', type: 'planned' as const, ctr: 2.1, conversions: 180, performance: 'On target' },
  { location: 'Midwest', type: 'planned' as const, ctr: 1.4, conversions: 95, performance: 'Underperforming' },
  { location: 'South', type: 'planned' as const, ctr: 2.8, conversions: 220, performance: 'On target' },
  { location: 'West Coast', type: 'planned' as const, ctr: 3.5, conversions: 310, performance: 'Overperforming' },
  { location: 'Urban (top 10)', type: 'planned' as const, ctr: 2.5, conversions: 200, performance: 'On target' },
]

const ACTUAL_LOCATIONS = [
  { location: 'West Coast', ctr: 3.5, conversions: 310, planned: true, performance: 'Overperforming' },
  { location: 'South', ctr: 2.8, conversions: 220, planned: true, performance: 'On target' },
  { location: 'Urban (top 10)', ctr: 5.8, conversions: 420, planned: true, performance: 'Overperforming' },
  { location: 'Northeast', ctr: 2.1, conversions: 180, planned: true, performance: 'On target' },
  { location: 'Midwest', ctr: 1.4, conversions: 95, planned: true, performance: 'Underperforming' },
]

const PLANNED_INTERESTS = [
  { interest: 'Tech & Gadgets', goal: 30, actual: 28 },
  { interest: 'Fashion', goal: 25, actual: 32 },
  { interest: 'Travel', goal: 20, actual: 18 },
  { interest: 'Sports', goal: 15, actual: 12 },
  { interest: 'Finance', goal: 10, actual: 10 },
]

const AUDIENCE_FIT_SCORE = 78

const INSIGHTS_STRONG = [
  'Over-indexing with 25-34 age group (+15% above target)',
  'Female audience engagement 40% higher than male (vs. planned 50/50 split)',
]
const INSIGHTS_MISMATCH = [
  'Missing 18-24 demographic (-22% below target)',
  'Midwest region underperforming by 35%',
]
const INSIGHTS_OPPORTUNITIES = [
  'Unexpected strength in 45-54 age group',
  'Urban centers outperforming suburban targets by 2.3x',
]

const RECOMMENDATIONS_IMMEDIATE = [
  'Adjust ad creative to better resonate with missing 18-24 demographic',
  'Reallocate budget from underperforming Midwest to overperforming West Coast',
  'Create targeted messaging for unexpectedly strong 45-54 segment',
]
const RECOMMENDATIONS_TESTING = [
  'A/B test: Different creative for missing vs. overperforming demographics',
  'Consider expanding targeting to include similar profiles to 45-54 success group',
]

const DEMO_STRONG_ALIGNMENT = INSIGHTS_STRONG
const DEMO_ADJUSTMENT_AREAS = INSIGHTS_MISMATCH
const DEMO_RECOMMENDED_ACTIONS = RECOMMENDATIONS_IMMEDIATE

export default function CampaignAnalytics() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [stakeholderActions, setStakeholderActions] = useState<StakeholderAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchData = async () => {
    try {
      const [campaignRes, phasesRes, metricsRes, stakeholderRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('execution_phases').select('*').eq('campaign_id', id).order('phase_number'),
        supabase.from('performance_metrics').select('*').eq('campaign_id', id).order('metric_date'),
        supabase.from('stakeholder_actions').select('*').eq('campaign_id', id).order('requested_date')
      ])

      if (campaignRes.data) setCampaign(campaignRes.data)
      if (phasesRes.data) setPhases(phasesRes.data)
      if (metricsRes.data) setPerformanceMetrics(metricsRes.data)
      if (stakeholderRes.data) setStakeholderActions(stakeholderRes.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Compute phase drift data from real phases
  const phaseDriftData = phases.map(phase => ({
    name: phase.phase_name,
    planned: phase.planned_duration_days,
    actual: phase.actual_duration_days || phase.planned_duration_days,
    drift: phase.drift_days || 0
  }))

  // Compute ROAS trend data from performance metrics
  const roasTrendData = performanceMetrics.map((metric, index) => ({
    day: `Day ${index + 1}`,
    roas: metric.roas || 0,
    target: campaign?.target_value || 2.5,
    spend: metric.spend || 0
  }))

  // Compute channel data (simplified - would need more sophisticated grouping in real app)
  const channelData = performanceMetrics.length > 0 ? [
    {
      channel: 'Meta Ads',
      spend: performanceMetrics.reduce((sum, m) => sum + (m.spend || 0), 0),
      revenue: performanceMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0),
      roas: performanceMetrics.length > 0 ? 
        performanceMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) / performanceMetrics.length : 0,
      conversions: performanceMetrics.reduce((sum, m) => sum + (m.conversions || 0), 0),
      ctr: performanceMetrics.length > 0 ? 
        performanceMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / performanceMetrics.length : 0
    }
  ] : []

  // Compute summary statistics
  const totalSpend = performanceMetrics.reduce((sum, m) => sum + (m.spend || 0), 0)
  const totalRevenue = performanceMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0)
  const totalConversions = performanceMetrics.reduce((sum, m) => sum + (m.conversions || 0), 0)
  const avgROAS = performanceMetrics.length > 0 ? 
    performanceMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) / performanceMetrics.length : 0
  const avgCTR = performanceMetrics.length > 0 ? 
    performanceMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / performanceMetrics.length : 0

  const getActorColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800'
      case 'agency':
        return 'bg-purple-100 text-purple-800'
      case 'external':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Strategic diagnosis: use real data when available, fallback to demo data
  const hasPerformanceData = performanceMetrics.length > 0
  const underperformingChannels = hasPerformanceData
    ? channelData.filter((c) => c.roas < (campaign?.target_value || 2.5))
    : []
  const totalDrift = phaseDriftData.reduce((acc, p) => acc + Math.abs(p.drift), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="accountability">Accountability</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Campaign metrics and KPI tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg ROAS</p>
                  <p className="text-2xl font-bold text-blue-600">{avgROAS.toFixed(1)}x</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold text-purple-600">{totalConversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Break-Even Day</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {hasPerformanceData ? 
                    `Day ${roasTrendData.findIndex(d => d.roas >= (campaign?.target_value || 2.5)) + 1}` :
                    'N/A'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">ROAS hit target</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Peak ROAS</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {hasPerformanceData ? `${Math.max(...roasTrendData.map(d => d.roas)).toFixed(1)}x` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Campaign peak</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Campaign lifetime</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Channel Breakdown Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                {channelData.length > 0 ? 
                  'Performance breakdown by channel' : 
                  'Channel performance data will be shown here once available'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {channelData.length > 0 ? (
                <div className="space-y-4">
                  {channelData.map((ch) => (
                    <div key={ch.channel} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{ch.channel}</h4>
                          <p className="text-sm text-muted-foreground">{formatCurrency(ch.spend)} spend</p>
                        </div>
                        <Badge variant={ch.roas >= (campaign?.target_value || 2.5) ? 'default' : 'destructive'}>
                          ROAS: {ch.roas.toFixed(1)}x
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Revenue</span>
                          <p className="font-semibold">{formatCurrency(ch.revenue)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions</span>
                          <p className="font-semibold">{ch.conversions}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CTR</span>
                          <p className="font-semibold">{(ch.ctr * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No channel data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Analysis Tab - Drift BarChart */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planned vs Actual Duration by Phase</CardTitle>
              <CardDescription>
                {phaseDriftData.length > 0 ? 
                  'Compare planned and actual execution time across phases' :
                  'Phase timeline data will be shown here once phases are defined'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phaseDriftData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={phaseDriftData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number | undefined) => value != null ? [`${value} days`] : ['']} />
                    <Legend />
                    <Bar dataKey="planned" fill="#93c5fd" name="Planned (days)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#2563eb" name="Actual (days)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-350 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No phase timeline data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drift summary table */}
          {phaseDriftData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Drift Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Phase</th>
                        <th className="pb-2 font-medium text-center">Planned</th>
                        <th className="pb-2 font-medium text-center">Actual</th>
                        <th className="pb-2 font-medium text-center">Drift</th>
                        <th className="pb-2 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phaseDriftData.map((row) => (
                        <tr key={row.name} className="border-b last:border-0">
                          <td className="py-2 font-medium">{row.name}</td>
                          <td className="py-2 text-center">{row.planned}d</td>
                          <td className="py-2 text-center">{row.actual}d</td>
                          <td className="py-2 text-center">
                            <Badge
                              variant={row.drift > 0 ? 'destructive' : row.drift < 0 ? 'default' : 'secondary'}
                              className={row.drift < 0 ? 'bg-green-600' : ''}
                            >
                              {row.drift > 0 ? '+' : ''}{row.drift}d
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            {row.drift === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                            ) : row.drift > 0 ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 inline" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-green-600 inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-center">{phaseDriftData.reduce((a, r) => a + r.planned, 0)}d</td>
                        <td className="py-2 text-center">{phaseDriftData.reduce((a, r) => a + r.actual, 0)}d</td>
                        <td className="py-2 text-center">
                          <Badge variant={totalDrift > 0 ? 'destructive' : totalDrift < 0 ? 'default' : 'secondary'}>
                            {totalDrift > 0 ? '+' : ''}{totalDrift}d
                          </Badge>
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audience Insights Tab - Demographic analysis */}
        <TabsContent value="audience" className="space-y-4">
          {/* Display rule banner */}
          {campaign?.status === 'completed' ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Final Analysis</AlertTitle>
              <AlertDescription>Full campaign demographic data from Meta Ads reports.</AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle>Preliminary Analysis</AlertTitle>
              <AlertDescription>Data from first 7+ days. Final demographics will update when the campaign completes.</AlertDescription>
            </Alert>
          )}

          {/* Unified demographic alignment tracker (target vs actual) */}
          <DemographicAlignmentTracker
            ageData={PLANNED_AGE_DATA}
            fitScore={AUDIENCE_FIT_SCORE}
            strongAlignment={DEMO_STRONG_ALIGNMENT}
            adjustmentAreas={DEMO_ADJUSTMENT_AREAS}
            recommendedActions={DEMO_RECOMMENDED_ACTIONS}
            variant={campaign?.status === 'completed' ? 'final' : 'preliminary'}
          />

          {/* Two-column: Planned vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Planned targets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Planned (Goal)</CardTitle>
                <CardDescription>Target audience from campaign brief</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Age distribution (goal %)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={PLANNED_AGE_DATA} layout="vertical" margin={{ left: 50 }}>
                      <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                      <YAxis type="category" dataKey="range" width={45} fontSize={11} />
                      <Bar dataKey="goal" fill="#2563eb" name="Goal %" radius={[0, 4, 4, 0]} />
                      <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Goal']} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Gender split (goal %)</p>
                  <div className="space-y-2">
                    {PLANNED_GENDER_DATA.map((row) => (
                      <div key={row.segment} className="flex items-center gap-2 text-sm">
                        <span className="w-20">{row.segment}</span>
                        <Progress value={row.goal} className="h-2 flex-1 max-w-[120px]" />
                        <span className="text-muted-foreground w-10">{row.goal}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Top planned locations</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {PLANNED_LOCATIONS.map((loc) => (
                      <li key={loc.location} className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {loc.location}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Interest categories (goal %)</p>
                  <div className="space-y-1.5 text-sm">
                    {PLANNED_INTERESTS.map((row) => (
                      <div key={row.interest} className="flex justify-between">
                        <span>{row.interest}</span>
                        <span className="text-muted-foreground">{row.goal}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right - Actual performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actual performance</CardTitle>
                <CardDescription>Demographic delivery from Meta Ads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Age distribution (actual %)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={PLANNED_AGE_DATA} layout="vertical" margin={{ left: 50 }}>
                      <XAxis type="number" domain={[0, 55]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                      <YAxis type="category" dataKey="range" width={45} fontSize={11} />
                      <Bar dataKey="actual" fill="#16a34a" name="Actual %" radius={[0, 4, 4, 0]} />
                      <Tooltip
                        formatter={(v: number | undefined, _name: string | undefined, props: { payload?: { diff?: number } }) => {
                          const diff = props?.payload?.diff
                          const value = v ?? 0
                          return [diff != null && diff !== 0 ? `${value}% (${diff > 0 ? '+' : ''}${diff}% vs goal)` : `${value}%`, 'Actual']
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PLANNED_AGE_DATA.map((row) => (
                      <span
                        key={row.range}
                        className={`text-xs ${row.diff > 0 ? 'text-green-600' : row.diff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                      >
                        {row.range}: {row.diff > 0 ? '+' : ''}{row.diff}%
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Gender (actual % vs goal)</p>
                  <div className="space-y-2">
                    {PLANNED_GENDER_DATA.map((row) => (
                      <div key={row.segment} className="flex items-center gap-2 text-sm">
                        <span className="w-20">{row.segment}</span>
                        <Progress value={row.actual} className="h-2 flex-1 max-w-[120px]" />
                        <span className="w-10">{row.actual}%</span>
                        {row.diff !== 0 && (
                          <span className={row.status === 'over' ? 'text-green-600' : 'text-red-600'}>
                            {row.status === 'over' ? <ArrowUp className="w-3.5 h-3.5 inline" /> : <ArrowDown className="w-3.5 h-3.5 inline" />}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Top 5 performing locations</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Location</th>
                          <th className="pb-2 font-medium text-right">CTR</th>
                          <th className="pb-2 font-medium text-right">Conversions</th>
                          <th className="pb-2 font-medium">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ACTUAL_LOCATIONS.map((loc) => (
                          <tr key={loc.location} className="border-b last:border-0">
                            <td className="py-2">{loc.location}</td>
                            <td className="py-2 text-right">{loc.ctr}%</td>
                            <td className="py-2 text-right">{loc.conversions}</td>
                            <td className="py-2">
                              <Badge
                                variant="outline"
                                className={
                                  loc.performance === 'Overperforming'
                                    ? 'border-green-500 text-green-700 bg-green-50'
                                    : loc.performance === 'Underperforming'
                                      ? 'border-red-500 text-red-700 bg-red-50'
                                      : ''
                                }
                              >
                                {loc.performance}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Engagement by interest (actual %)</p>
                  <div className="space-y-1.5 text-sm">
                    {PLANNED_INTERESTS.map((row) => (
                      <div key={row.interest} className="flex justify-between">
                        <span>{row.interest}</span>
                        <span className={row.actual >= row.goal ? 'text-green-600' : 'text-muted-foreground'}>{row.actual}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demographic summary panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Audience fit summary
              </CardTitle>
              <CardDescription>Alignment of actual delivery vs. planned targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50 dark:bg-green-950/20">
                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">{AUDIENCE_FIT_SCORE}%</span>
                  </div>
                  <p className="text-sm font-medium mt-2">Audience Fit Score</p>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                      <ArrowUp className="w-3.5 h-3.5" /> Strong matches
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {INSIGHTS_STRONG.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                      <ArrowDown className="w-3.5 h-3.5" /> Mismatches
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {INSIGHTS_MISMATCH.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Opportunities
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {INSIGHTS_OPPORTUNITIES.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations based on demographic gaps</CardTitle>
              <CardDescription>Actions to improve audience alignment and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Immediate actions
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {RECOMMENDATIONS_IMMEDIATE.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" /> Testing opportunities
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {RECOMMENDATIONS_TESTING.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accountability Tab */}
        <TabsContent value="accountability">
          <Card>
            <CardHeader>
              <CardTitle>Accountability Log</CardTitle>
              <CardDescription>
                {stakeholderActions.length > 0 ?
                  'Track decisions and their impact on campaign performance' :
                  'Accountability data will be shown here as stakeholder actions are logged'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stakeholderActions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Stakeholder</th>
                        <th className="pb-2 font-medium">Action</th>
                        <th className="pb-2 font-medium">Impact</th>
                        <th className="pb-2 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stakeholderActions.map((entry) => (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(entry.requested_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3">
                            <Badge className={`${getActorColor(entry.stakeholder_type)} text-xs`} variant="secondary">
                              {entry.stakeholder_name}
                            </Badge>
                          </td>
                          <td className="py-3">{entry.action_description}</td>
                          <td className="py-3 text-muted-foreground">{entry.delay_impact || 'On schedule'}</td>
                          <td className="py-3 text-center">
                            {entry.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                            ) : entry.status === 'overdue' ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 inline" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-500 inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No accountability data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
