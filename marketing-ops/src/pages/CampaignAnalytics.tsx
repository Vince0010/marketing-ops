import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  FlaskConical,
  Lightbulb,
  TestTube,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import { formatCurrency } from '@/utils/formatting'

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

// Strategic failure diagnosis: seeded content when drift is low but performance is poor
const DIAGNOSIS_PRIMARY = {
  mostLikelyCause: 'Creative / Targeting Mismatch',
  confidence: 82,
  confidenceLabel: 'High' as const,
  keyEvidence: [
    'CTR 1.2% vs benchmark 2.5% despite reach at 110% of plan',
    'Image relevance score (platform) 4/10 on primary creative',
    'Lookalike audience similarity 40% — below recommended 60%',
    'High frequency (4.2) with declining engagement by day 7',
  ],
}

const DIAGNOSIS_HYPOTHESES = [
  {
    rank: 1,
    title: 'CREATIVE/TARGETING MISMATCH',
    confidence: 75,
    evidence: 'Low CTR despite good reach',
    supportingData: 'Image relevance score 4/10',
  },
  {
    rank: 2,
    title: 'AUDIENCE ASSUMPTIONS WRONG',
    confidence: 65,
    evidence: 'High frequency, low conversions',
    supportingData: 'Lookalike similarity 40%',
  },
  {
    rank: 3,
    title: 'TIMING/SEASONALITY ISSUE',
    confidence: 45,
    evidence: 'Weekend vs weekday performance gap',
    supportingData: 'Competitor activity spike',
  },
]

const AB_TEST_RECOMMENDATIONS = [
  {
    testType: 'Headline Test',
    hypothesis: 'Current CTAs don\'t resonate',
    setup: 'Test 2 new headlines vs control',
    successCriteria: 'CTR increase > 50%',
    timeRequired: '3 days',
  },
  {
    testType: 'Audience Expansion',
    hypothesis: 'Core audience too narrow',
    setup: 'Add 1 similar interest category',
    successCriteria: 'CPA decrease > 20%',
    timeRequired: '5 days',
  },
  {
    testType: 'Creative Refresh',
    hypothesis: 'Ad creative fatigue',
    setup: 'Replace primary image/video',
    successCriteria: 'Engagement rate > 3%',
    timeRequired: '4 days',
  },
]

const DIAGNOSIS_ACTION_PLAN = {
  immediate: 'Pause underperforming ad sets (CTR < 1%), reduce daily budget by 20% on underperforming placements, and shift spend to top 2 audiences.',
  dataCollection: 'Survey 50 customers on message relevance; run competitor ad spy report; pull platform relevance and quality scores by creative.',
  nextTest: 'Headline Test — launch 2 new headlines vs control by next Monday; review after 3 days.',
}

export default function CampaignAnalytics() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [, setPhases] = useState<ExecutionPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [showDiagnosisPanel, setShowDiagnosisPanel] = useState(false)
  const [diagnosisComplete, setDiagnosisComplete] = useState(false)

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

  const getActorColor = (type: string) => {
    switch (type) {
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'creative':
        return 'bg-purple-100 text-purple-800'
      case 'compliance':
        return 'bg-orange-100 text-orange-800'
      case 'analyst':
        return 'bg-green-100 text-green-800'
      case 'specialist':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'negative':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  // Strategic diagnosis: flag if any channel underperforms
  const underperformingChannels = CHANNEL_DATA.filter((c) => c.roas < 2.5)
  const totalDrift = PHASE_DRIFT_DATA.reduce((acc, p) => acc + p.drift, 0)
  const targetRoas = 2.5
  const lastRoas = ROAS_TREND_DATA.length > 0 ? ROAS_TREND_DATA[ROAS_TREND_DATA.length - 1].roas : 0
  const performancePercentOfTarget = targetRoas > 0 ? (lastRoas / targetRoas) * 100 : 0
  const minimalDrift = totalDrift <= 2
  const poorPerformance = performancePercentOfTarget < 70
  const failureDetected = minimalDrift && poorPerformance

  useEffect(() => {
    if (failureDetected && !showDiagnosisPanel) setShowDiagnosisPanel(true)
  }, [failureDetected])

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
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
        <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Completed
        </Badge>
      </div>

      {/* Strategic Diagnosis Alert */}
      {totalDrift > 3 && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Strategic Diagnosis</AlertTitle>
          <AlertDescription className="text-orange-700">
            This campaign experienced +{totalDrift} days of total drift across execution phases.
            The Creative and Compliance phases were primary contributors. Consider adding buffer days
            and parallel review processes in future campaign templates.
          </AlertDescription>
        </Alert>
      )}

      {underperformingChannels.length > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <TrendingDown className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Channel Performance Warning</AlertTitle>
          <AlertDescription className="text-yellow-700">
            {underperformingChannels.map((c) => c.channel).join(', ')}{' '}
            {underperformingChannels.length === 1 ? 'is' : 'are'} performing below the target ROAS of 2.5x.
            Consider reallocating budget to higher-performing channels in future campaigns.
          </AlertDescription>
        </Alert>
      )}

      {/* Strategic Failure Diagnosis — Root Cause Analysis */}
      {!showDiagnosisPanel ? (
        <Card className="border-dashed border-red-200 bg-red-50/30 dark:bg-red-950/10">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Root Cause Analysis</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  When execution is clean but performance misses target, run a strategic diagnosis for ranked hypotheses and A/B test recommendations.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              onClick={() => {
                setShowDiagnosisPanel(true)
                setDiagnosisComplete(false)
              }}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-red-300 dark:border-red-800 overflow-hidden">
          <CardHeader className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-900 dark:text-red-100">Strategic Diagnosis — Root Cause Analysis</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    diagnosisComplete
                      ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                      : 'border-red-500 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }
                >
                  {diagnosisComplete ? 'ANALYSIS COMPLETE' : 'DIAGNOSIS ACTIVE'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
                  onClick={() => setShowDiagnosisPanel(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <CardDescription className="text-red-800 dark:text-red-200">
              Failure detected: minimal execution drift but performance below 70% of KPI target. Actionable insights below.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* 1. Primary Diagnosis */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Primary Diagnosis
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-muted-foreground">Most Likely Cause:</span>
                  <span className="font-semibold text-lg">{DIAGNOSIS_PRIMARY.mostLikelyCause}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Confidence Score:</span>
                  <Badge variant="secondary" className="font-mono">
                    {DIAGNOSIS_PRIMARY.confidence}%
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      DIAGNOSIS_PRIMARY.confidenceLabel === 'High'
                        ? 'border-green-500 text-green-700'
                        : DIAGNOSIS_PRIMARY.confidenceLabel === 'Medium'
                          ? 'border-amber-500 text-amber-700'
                          : 'border-red-500 text-red-700'
                    }
                  >
                    {DIAGNOSIS_PRIMARY.confidenceLabel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Key Evidence:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {DIAGNOSIS_PRIMARY.keyEvidence.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Ranked Hypotheses Grid */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ranked Hypotheses
              </h3>
              <div className="grid gap-3">
                {DIAGNOSIS_HYPOTHESES.map((h) => (
                  <div
                    key={h.rank}
                    className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                        {h.rank}
                      </span>
                      <div>
                        <p className="font-semibold text-sm uppercase tracking-wide">{h.title}</p>
                        <p className="text-xs text-muted-foreground">Confidence: {h.confidence}%</p>
                      </div>
                    </div>
                    <div className="flex-1 text-sm space-y-1">
                      <p><span className="text-muted-foreground">Evidence:</span> {h.evidence}</p>
                      <p><span className="text-muted-foreground">Supporting Data:</span> {h.supportingData}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. A/B Test Recommendations Table */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                A/B Test Recommendations
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Test Type</th>
                      <th className="text-left p-3 font-medium">Hypothesis</th>
                      <th className="text-left p-3 font-medium">Setup</th>
                      <th className="text-left p-3 font-medium">Success Criteria</th>
                      <th className="text-left p-3 font-medium">Time Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AB_TEST_RECOMMENDATIONS.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3 font-medium">{row.testType}</td>
                        <td className="p-3">{row.hypothesis}</td>
                        <td className="p-3">{row.setup}</td>
                        <td className="p-3">{row.successCriteria}</td>
                        <td className="p-3">{row.timeRequired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Action Plan */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Action Plan
              </h3>
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Immediate Action</p>
                  <p className="text-sm">{DIAGNOSIS_ACTION_PLAN.immediate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Data Collection</p>
                  <p className="text-sm">{DIAGNOSIS_ACTION_PLAN.dataCollection}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Next Test</p>
                  <p className="text-sm">{DIAGNOSIS_ACTION_PLAN.nextTest}</p>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDiagnosisComplete(true)}
              >
                Mark analysis complete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground mt-1">95% of budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3.2x</div>
            <p className="text-xs text-green-600 mt-1">+28% above target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-green-600 mt-1">+15% vs target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8%</div>
            <p className="text-xs text-muted-foreground mt-1">Industry avg: 2.1%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="channels">Channel Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
          <TabsTrigger value="accountability">Accountability</TabsTrigger>
        </TabsList>

        {/* Performance Tab - ROAS LineChart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROAS Trend Over Campaign Duration</CardTitle>
              <CardDescription>Actual ROAS vs target over 30-day campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={ROAS_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${v}x`} />
                  <Tooltip
                    formatter={(value, name) => [
                      value == null ? '' : name === 'spend' ? `$${Number(value).toLocaleString()}` : `${value}x`,
                      name === 'roas' ? 'Actual ROAS' : name === 'target' ? 'Target ROAS' : 'Spend',
                    ]}
                  />
                  <Legend />
                  <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
                  <Line
                    type="monotone"
                    dataKey="roas"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 4 }}
                    name="Actual ROAS"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#dc2626"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target ROAS"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Break-Even Day</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">Day 10</p>
                <p className="text-xs text-muted-foreground mt-1">ROAS hit 2.5x target</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Peak ROAS</p>
                <p className="text-3xl font-bold text-green-600 mt-1">3.2x</p>
                <p className="text-xs text-muted-foreground mt-1">Achieved Day 25+</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">$144,739</p>
                <p className="text-xs text-green-600 mt-1">+$99,508 net</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Channel Breakdown Tab */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Compare performance across marketing channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CHANNEL_DATA.map((ch) => (
                <div key={ch.channel} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{ch.channel}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(ch.spend)} spend</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ch.roas >= 3 ? 'default' : ch.roas >= 2.5 ? 'secondary' : 'destructive'}
                        className={ch.roas >= 3 ? 'bg-green-600' : ''}
                      >
                        ROAS: {ch.roas}x
                      </Badge>
                    </div>
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
                      <p className="font-semibold">{ch.ctr}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Analysis Tab - Drift BarChart */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planned vs Actual Duration by Phase</CardTitle>
              <CardDescription>Compare planned and actual execution time across phases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={PHASE_DRIFT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [value != null ? `${value} days` : '']} />
                  <Legend />
                  <Bar dataKey="planned" fill="#93c5fd" name="Planned (days)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#2563eb" name="Actual (days)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Drift summary table */}
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
                    {PHASE_DRIFT_DATA.map((row) => (
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
                      <td className="py-2 text-center">{PHASE_DRIFT_DATA.reduce((a, r) => a + r.planned, 0)}d</td>
                      <td className="py-2 text-center">{PHASE_DRIFT_DATA.reduce((a, r) => a + r.actual, 0)}d</td>
                      <td className="py-2 text-center">
                        <Badge variant="destructive">+{totalDrift}d</Badge>
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accountability Tab */}
        <TabsContent value="accountability">
          <Card>
            <CardHeader>
              <CardTitle>Accountability Log</CardTitle>
              <CardDescription>Track decisions and their impact on campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Actor</th>
                      <th className="pb-2 font-medium">Action</th>
                      <th className="pb-2 font-medium">Impact</th>
                      <th className="pb-2 font-medium text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCOUNTABILITY_LOG.map((entry, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3">
                          <Badge className={`${getActorColor(entry.actorType)} text-xs`} variant="secondary">
                            {entry.actor}
                          </Badge>
                        </td>
                        <td className="py-3">{entry.action}</td>
                        <td className="py-3 text-muted-foreground">{entry.impact}</td>
                        <td className="py-3 text-center">{getSentimentIcon(entry.sentiment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
