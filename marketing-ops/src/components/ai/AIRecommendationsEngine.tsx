import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  AlertTriangle,
  Target,
  DollarSign,
  Clock,
  Zap,
  RefreshCw,
  CheckCircle,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'Budget' | 'Creative' | 'Timeline' | 'Targeting' | 'Performance' | 'Risk'
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  confidence: number // 0-100
  dataSource: string
  reasoning: string
  actionRequired: boolean
  estimatedOutcome?: string
  implementationSteps?: string[]
  icon: React.ReactNode
  timestamp: string
}

interface AIEngineProps {
  campaign: Campaign
  phases: ExecutionPhase[]
  driftEvents: DriftEvent[]
  onApplyRecommendation?: (recommendation: Recommendation) => void
}

// DeepSeek AI simulation for demo (in production, this would call actual API)
const generateAIRecommendations = async (
  campaign: Campaign,
  phases: ExecutionPhase[],
  driftEvents: DriftEvent[]
): Promise<Recommendation[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  const recommendations: Recommendation[] = []
  const completedPhases = phases.filter(p => p.status === 'completed')
  const avgDrift = completedPhases.length > 0 
    ? completedPhases.reduce((acc, p) => acc + Math.abs(p.drift_days || 0), 0) / completedPhases.length
    : 0

  // Budget optimization based on performance
  if (campaign.status === 'in_progress' && campaign.performance_health < 80) {
    recommendations.push({
      id: 'ai-budget-1',
      title: 'Reallocate Budget to High-Performing Channels',
      description: 'Facebook Feed is outperforming Instagram Stories by 340%. Recommend shifting 25% budget allocation.',
      category: 'Budget',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      confidence: 89,
      dataSource: 'Meta Ads Performance Analytics',
      reasoning: 'Facebook Feed CPL: $18.50 vs Instagram Stories CPL: $62.80. Clear performance differential detected.',
      actionRequired: true,
      estimatedOutcome: '+23% lead volume, -15% CPL',
      implementationSteps: [
        'Reduce Instagram Stories daily budget from $300 to $225',
        'Increase Facebook Feed daily budget from $400 to $475',
        'Monitor performance for 48 hours',
        'Adjust further if trend continues'
      ],
      icon: <DollarSign className="w-4 h-4" />,
      timestamp: new Date().toISOString(),
    })
  }

  // Timeline management based on drift
  if (avgDrift > 1.5) {
    recommendations.push({
      id: 'ai-timeline-1',
      title: 'Extend Optimization Phase Duration',
      description: `Average drift of ${avgDrift.toFixed(1)} days detected. Current ROAS trend suggests 3-day extension could yield 0.8x improvement.`,
      category: 'Timeline',
      priority: 'medium',
      impact: 'high',
      effort: 'low',
      confidence: 76,
      dataSource: 'Historical Performance Patterns + Drift Analysis',
      reasoning: 'Similar campaigns with comparable drift patterns show 80% success rate when optimization phase extended by 2-4 days.',
      actionRequired: false,
      estimatedOutcome: '+0.8x ROAS improvement, +12% conversion rate',
      implementationSteps: [
        'Review current optimization phase end date',
        'Negotiate 3-day extension with client',
        'Implement advanced bidding strategies',
        'Deploy additional creative variants'
      ],
      icon: <Clock className="w-4 h-4" />,
      timestamp: new Date().toISOString(),
    })
  }

  // Creative fatigue detection
  if (campaign.status === 'in_progress') {
    recommendations.push({
      id: 'ai-creative-1',
      title: 'Deploy Creative Refresh Strategy',
      description: 'Ad fatigue detected on primary video creative (CTR declined 40% over 5 days). Immediate creative rotation recommended.',
      category: 'Creative',
      priority: 'critical',
      impact: 'high',
      effort: 'medium',
      confidence: 94,
      dataSource: 'Creative Performance Monitoring',
      reasoning: 'Primary video creative CTR dropped from 3.2% to 1.9%. Frequency reached 4.8x, indicating saturation.',
      actionRequired: true,
      estimatedOutcome: '+180% CTR recovery, -30% CPC',
      implementationSteps: [
        'Pause current video creative immediately',
        'Launch backup video creative B',
        'Create 2 new static variants for A/B test',
        'Implement dynamic creative rotation'
      ],
      icon: <Zap className="w-4 h-4" />,
      timestamp: new Date().toISOString(),
    })
  }

  // Targeting refinement based on performance data
  if (campaign.campaign_type === 'lead_gen') {
    recommendations.push({
      id: 'ai-targeting-1',
      title: 'Narrow Audience to High-Converting Segments',
      description: 'Segment analysis reveals 25-34 urban professionals converting 3.4x better. Recommend audience refinement.',
      category: 'Targeting',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      confidence: 87,
      dataSource: 'Audience Performance Analytics',
      reasoning: '25-34 urban segment: 12.3% conversion rate, $19 CPL vs overall average: 3.6% conversion, $48 CPL',
      actionRequired: false,
      estimatedOutcome: '+240% conversion efficiency, -60% CPL',
      implementationSteps: [
        'Create new ad set targeting 25-34 urban professionals',
        'Gradually shift 40% of budget to high-performing segment',
        'Exclude underperforming demographics',
        'Create segment-specific ad copy'
      ],
      icon: <Target className="w-4 h-4" />,
      timestamp: new Date().toISOString(),
    })
  }

  // Risk mitigation
  if (driftEvents.length > 2) {
    recommendations.push({
      id: 'ai-risk-1',
      title: 'Implement Timeline Risk Controls',
      description: `${driftEvents.length} drift events detected. Pattern suggests systematic timeline management issues.`,
      category: 'Risk',
      priority: 'medium',
      impact: 'medium',
      effort: 'medium',
      confidence: 71,
      dataSource: 'Drift Pattern Analysis',
      reasoning: 'Recurring drift in creative development and approval phases suggests process bottlenecks.',
      actionRequired: false,
      estimatedOutcome: '-50% timeline drift probability',
      implementationSteps: [
        'Implement phase gate checkpoints',
        'Add 20% buffer to creative development phases',
        'Establish approval SLAs with stakeholders',
        'Create escalation procedures for delays'
      ],
      icon: <AlertTriangle className="w-4 h-4" />,
      timestamp: new Date().toISOString(),
    })
  }

  return recommendations
}

export default function AIRecommendationsEngine({ 
  campaign, 
  phases, 
  driftEvents, 
  onApplyRecommendation 
}: AIEngineProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set())

  const generateRecommendations = useCallback(async () => {
    setLoading(true)
    try {
      const newRecommendations = await generateAIRecommendations(campaign, phases, driftEvents)
      setRecommendations(newRecommendations)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Fallback to static recommendations
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }, [campaign, phases, driftEvents])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const handleApplyRecommendation = (recommendation: Recommendation) => {
    setAppliedRecommendations(prev => new Set(prev).add(recommendation.id))
    onApplyRecommendation?.(recommendation)
  }

  const handleDismissRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId))
  }

  const getFilteredRecommendations = () => {
    if (activeTab === 'all') return recommendations
    if (activeTab === 'critical') return recommendations.filter(r => r.priority === 'critical')
    return recommendations.filter(r => r.category.toLowerCase() === activeTab)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-600'
      case 'medium': return 'bg-yellow-600'
      default: return 'bg-red-600'
    }
  }

  const criticalCount = recommendations.filter(r => r.priority === 'critical').length
  const actionRequiredCount = recommendations.filter(r => r.actionRequired).length

  return (
    <div className="space-y-6">
      {/* AI Engine Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI Recommendations Engine</CardTitle>
                <CardDescription className="text-sm">
                  Powered by DeepSeek AI • Real-time campaign optimization
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateRecommendations}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
              <div className="text-sm text-muted-foreground">Total Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{actionRequiredCount}</div>
              <div className="text-sm text-muted-foreground">Action Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{appliedRecommendations.size}</div>
              <div className="text-sm text-muted-foreground">Applied</div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Action Required</AlertTitle>
          <AlertDescription>
            {criticalCount} critical recommendation{criticalCount > 1 ? 's' : ''} require immediate attention to prevent performance degradation.
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalCount})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="creative">Creative</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">AI Analysis in Progress</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyzing campaign data and generating recommendations...
                    </p>
                  </div>
                  <Progress value={75} className="w-64 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : getFilteredRecommendations().length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">No Recommendations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign is performing optimally. Check back later for new insights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredRecommendations().map((recommendation) => {
                const isApplied = appliedRecommendations.has(recommendation.id)
                
                return (
                  <Card key={recommendation.id} className={`${isApplied ? 'opacity-60' : ''}`}>
                    <CardContent className="pt-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            {recommendation.icon}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                              {isApplied && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(recommendation.impact)}>
                            {recommendation.impact} impact
                          </Badge>
                          <Badge className={getEffortColor(recommendation.effort)}>
                            {recommendation.effort} effort
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {recommendation.confidence}% confidence
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-blue-900 mb-1">AI Analysis:</div>
                          <div className="text-blue-800 mb-2">{recommendation.reasoning}</div>
                          <div className="text-xs text-blue-600">
                            Data source: {recommendation.dataSource}
                          </div>
                        </div>
                      </div>

                      {/* Expected Outcome */}
                      {recommendation.estimatedOutcome && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-green-900 mb-1">Expected Outcome:</div>
                            <div className="text-green-800">{recommendation.estimatedOutcome}</div>
                          </div>
                        </div>
                      )}

                      {/* Implementation Steps */}
                      {recommendation.implementationSteps && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Implementation Steps:</h5>
                          <ol className="text-sm text-muted-foreground space-y-1">
                            {recommendation.implementationSteps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {recommendation.actionRequired && (
                            <span className="text-orange-600 font-medium">Action required</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isApplied && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDismissRecommendation(recommendation.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApplyRecommendation(recommendation)}
                                className="gap-1"
                              >
                                Apply Now
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {isApplied && (
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}