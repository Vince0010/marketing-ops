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
  FileX,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import type { PerformanceMetric, StakeholderAction } from '@/types/database'
import { formatCurrency } from '@/utils/formatting'

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

  if (!hasPerformanceData && !campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Analytics</h1>
            <p className="text-muted-foreground mt-1">Campaign {id}</p>
          </div>
        </div>
        <Alert>
          <FileX className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            This campaign doesn't have performance data yet. Analytics will be available once the campaign has started collecting metrics.
          </AlertDescription>
        </Alert>
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
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign?.total_budget ? `${Math.round((totalSpend / campaign.total_budget) * 100)}% of budget` : 'No budget set'}
            </p>
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
            <div className={`text-2xl font-bold ${avgROAS >= (campaign?.target_value || 2.5) ? 'text-green-600' : 'text-red-600'}`}>
              {avgROAS.toFixed(1)}x
            </div>
            <p className={`text-xs mt-1 ${avgROAS >= (campaign?.target_value || 2.5) ? 'text-green-600' : 'text-red-600'}`}>
              {campaign?.target_value ? 
                `${avgROAS >= campaign.target_value ? '+' : ''}${Math.round(((avgROAS / campaign.target_value) - 1) * 100)}% vs target` :
                'No target set'
              }
            </p>
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
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.length > 0 ? `Avg ${Math.round(totalConversions / performanceMetrics.length)} per day` : 'No data yet'}
            </p>
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
            <div className="text-2xl font-bold">{(avgCTR * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry avg: 2.1%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="flex flex-wrap">
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
              <CardDescription>
                {hasPerformanceData ? 
                  `Actual ROAS vs target over ${performanceMetrics.length} data points` : 
                  'Performance data will be shown here once available'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasPerformanceData ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={roasTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${v}x`} />
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => [
                        (name === 'spend' ? formatCurrency(value || 0) : `${value || 0}x`),
                        (name === 'roas' ? 'Actual ROAS' : name === 'target' ? 'Target ROAS' : 'Spend'),
                      ]}
                    />
                    <Legend />
                    <ReferenceLine y={campaign?.target_value || 2.5} stroke="#ef4444" strokeDasharray="5 5" label="Target" />
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
              ) : (
                <div className="h-350 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No performance data available yet</p>
                  </div>
                </div>
              )}
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
