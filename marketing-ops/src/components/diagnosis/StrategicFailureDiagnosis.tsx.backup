import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  TrendingDown,
  FileText,
  CheckCircle2,
  Lightbulb,
  Shield,
  Zap,
  Brain,
} from 'lucide-react'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'

interface FailurePattern {
  id: string
  name: string
  description: string
  frequency: number
  impact_level: 'low' | 'medium' | 'high' | 'critical'
  typical_causes: string[]
  warning_signs: string[]
  prevention_strategies: string[]
  recovery_actions: string[]
  industry_context: string
  success_rate: number
}

interface FailureDiagnosis {
  campaign_id: string
  failure_type: string
  root_causes: string[]
  contributing_factors: string[]
  impact_assessment: {
    budget_waste: number
    timeline_delay: number
    kpi_shortfall: number
    reputation_impact: 'low' | 'medium' | 'high'
  }
  lessons_learned: string[]
  prevention_plan: string[]
  template_created: boolean
  remediation_status: 'planned' | 'in_progress' | 'completed'
  confidence_score: number
}

interface StrategicFailureDiagnosisProps {
  campaign: Campaign
  phases: ExecutionPhase[]
  driftEvents: DriftEvent[]
  onCreateTemplate?: (diagnosis: FailureDiagnosis) => void
}

// Common failure patterns database (would be real data in production)
const FAILURE_PATTERNS: FailurePattern[] = [
  {
    id: 'pattern-audience-mismatch',
    name: 'Audience-Creative Mismatch',
    description: 'Creative messaging does not resonate with target audience demographics or psychographics',
    frequency: 34,
    impact_level: 'high',
    typical_causes: [
      'Insufficient audience research',
      'Generic creative approach',
      'Demographic assumptions',
      'Missing persona validation'
    ],
    warning_signs: [
      'Low CTR despite good reach',
      'High CPC with low conversions',
      'Poor engagement metrics',
      'High bounce rate on landing pages'
    ],
    prevention_strategies: [
      'Conduct comprehensive audience research',
      'Create persona-specific creative variants',
      'A/B test messaging frameworks',
      'Validate assumptions with focus groups'
    ],
    recovery_actions: [
      'Pause underperforming creative immediately',
      'Develop audience-specific messaging',
      'Implement dynamic creative optimization',
      'Reallocate budget to validated segments'
    ],
    industry_context: 'Most common in B2C lead generation campaigns targeting broad demographics',
    success_rate: 78
  },
  {
    id: 'pattern-budget-misallocation',
    name: 'Channel Budget Misallocation',
    description: 'Budget distributed across channels without performance-based optimization',
    frequency: 28,
    impact_level: 'high',
    typical_causes: [
      'Equal budget distribution assumption',
      'Lack of real-time performance monitoring',
      'Over-reliance on historical data',
      'Platform preference bias'
    ],
    warning_signs: [
      'High variance in channel CPL/CPA',
      'Some channels exhausting budget early',
      'Declining overall ROAS',
      'Uneven conversion distribution'
    ],
    prevention_strategies: [
      'Implement dynamic budget allocation',
      'Set up real-time performance monitoring',
      'Use automated bidding strategies',
      'Regular channel performance reviews'
    ],
    recovery_actions: [
      'Reallocate budget to top performers',
      'Pause underperforming channels',
      'Increase bids on converting placements',
      'Test new channel opportunities'
    ],
    industry_context: 'Critical for multi-channel campaigns with diverse audience segments',
    success_rate: 85
  },
  {
    id: 'pattern-creative-fatigue',
    name: 'Accelerated Creative Fatigue',
    description: 'Creative assets lose effectiveness faster than anticipated due to high frequency',
    frequency: 42,
    impact_level: 'medium',
    typical_causes: [
      'Limited creative variety',
      'High frequency targeting',
      'Narrow audience size',
      'Poor creative refresh strategy'
    ],
    warning_signs: [
      'Declining CTR over time',
      'Increasing frequency rates',
      'Rising CPC/CPM',
      'Engagement rate decline'
    ],
    prevention_strategies: [
      'Develop creative asset pipeline',
      'Implement frequency caps',
      'Plan creative refresh schedule',
      'Create dynamic creative variations'
    ],
    recovery_actions: [
      'Deploy fresh creative immediately',
      'Lower frequency caps',
      'Expand audience size',
      'Implement creative rotation'
    ],
    industry_context: 'Common in social media campaigns with limited creative budgets',
    success_rate: 91
  },
  {
    id: 'pattern-timeline-cascade',
    name: 'Timeline Cascade Failure',
    description: 'Early phase delays create compounding effects across subsequent phases',
    frequency: 19,
    impact_level: 'critical',
    typical_causes: [
      'Inadequate phase buffer time',
      'Dependency mapping failures',
      'Stakeholder approval bottlenecks',
      'Resource allocation conflicts'
    ],
    warning_signs: [
      'Multiple phase delays',
      'Compressed optimization periods',
      'Rushed creative development',
      'Stakeholder escalations'
    ],
    prevention_strategies: [
      'Build 20% buffer into critical phases',
      'Map all dependencies clearly',
      'Establish approval SLAs',
      'Implement phase gate reviews'
    ],
    recovery_actions: [
      'Compress non-critical phases',
      'Deploy additional resources',
      'Negotiate timeline extensions',
      'Parallel process where possible'
    ],
    industry_context: 'High-stakes launches with firm external deadlines',
    success_rate: 62
  }
]

export default function StrategicFailureDiagnosis({ 
  campaign, 
  phases, 
  driftEvents,
  onCreateTemplate 
}: StrategicFailureDiagnosisProps) {
  const [analysis, setAnalysis] = useState<FailureDiagnosis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('diagnosis')
  const [selectedPattern, setSelectedPattern] = useState<FailurePattern | null>(null)
  const [customNotes, setCustomNotes] = useState('')

  // AI-powered failure analysis
  const analyzeFailures = useCallback(async () => {
    setLoading(true)
    
    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Calculate failure indicators
      const completedPhases = phases.filter(p => p.status === 'completed')
      const avgDrift = completedPhases.length > 0 
        ? completedPhases.reduce((acc, p) => acc + Math.abs(p.drift_days || 0), 0) / completedPhases.length
        : 0
      
      const negativeEvents = driftEvents.filter(d => d.drift_type === 'negative')
      const healthScore = campaign.performance_health || 0
      
      // Determine primary failure patterns based on data
      const diagnosis: FailureDiagnosis = {
        campaign_id: campaign.id,
        failure_type: healthScore < 60 ? 'strategic_failure' : avgDrift > 3 ? 'execution_failure' : 'performance_issue',
        root_causes: [],
        contributing_factors: [],
        impact_assessment: {
          budget_waste: 0,
          timeline_delay: Math.round(avgDrift),
          kpi_shortfall: Math.max(0, 100 - healthScore),
          reputation_impact: healthScore < 50 ? 'high' : healthScore < 75 ? 'medium' : 'low'
        },
        lessons_learned: [],
        prevention_plan: [],
        template_created: false,
        remediation_status: 'planned',
        confidence_score: 0
      }
      
      // AI-powered root cause analysis
      if (healthScore < 70) {
        diagnosis.root_causes.push('Performance metrics below acceptable threshold')
        diagnosis.contributing_factors.push('Possible audience-creative mismatch')
        diagnosis.lessons_learned.push('Earlier performance intervention required')
        diagnosis.prevention_plan.push('Implement daily performance monitoring')
        diagnosis.confidence_score += 25
      }
      
      if (avgDrift > 2) {
        diagnosis.root_causes.push('Systematic timeline management issues')
        diagnosis.contributing_factors.push('Inadequate phase planning and buffer time')
        diagnosis.lessons_learned.push('Timeline estimates consistently underestimated')
        diagnosis.prevention_plan.push('Add 25% buffer time to creative and approval phases')
        diagnosis.confidence_score += 25
      }
      
      if (negativeEvents.length > 2) {
        diagnosis.root_causes.push('Recurring execution delays')
        diagnosis.contributing_factors.push('Process bottlenecks in approval workflow')
        diagnosis.lessons_learned.push('Stakeholder approval process needs optimization')
        diagnosis.prevention_plan.push('Establish clear approval SLAs and escalation procedures')
        diagnosis.confidence_score += 20
      }
      
      if (campaign.campaign_type === 'lead_gen' && healthScore < 80) {
        diagnosis.root_causes.push('Lead generation efficiency below target')
        diagnosis.contributing_factors.push('Potential targeting or conversion optimization issues')
        diagnosis.lessons_learned.push('More aggressive early optimization required')
        diagnosis.prevention_plan.push('Implement automated bid optimization and audience expansion')
        diagnosis.confidence_score += 15
      }
      
      // Calculate budget waste based on performance
      if (healthScore < 70) {
        const totalBudget = campaign.total_budget || 0
        diagnosis.impact_assessment.budget_waste = Math.round(totalBudget * (100 - healthScore) / 100 * 0.3) // 30% of shortfall
      }
      
      diagnosis.confidence_score = Math.min(diagnosis.confidence_score, 95)
      
      setAnalysis(diagnosis)
    } catch (error) {
      console.error('Error analyzing failures:', error)
    } finally {
      setLoading(false)
    }
  }, [campaign, phases, driftEvents])

  useEffect(() => {
    if (campaign && (campaign.performance_health < 80 || driftEvents.length > 1)) {
      analyzeFailures()
    }
  }, [campaign, phases, driftEvents, analyzeFailures])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      default: return 'text-blue-700 bg-blue-100 border-blue-200'
    }
  }

  const handleCreateTemplate = () => {
    if (analysis) {
      const template = { ...analysis, template_created: true }
      setAnalysis(template)
      onCreateTemplate?.(template)
    }
  }

  // Check if this campaign qualifies for failure diagnosis
  const qualifiesForDiagnosis = campaign && 
    (campaign.performance_health < 80 || 
     driftEvents.length > 1 || 
     campaign.status === 'paused' || 
     phases.filter(p => p.drift_days && p.drift_days > 2).length > 0)

  if (!qualifiesForDiagnosis) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">No Strategic Failures Detected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Campaign is performing within acceptable parameters. Failure analysis will activate if issues arise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {campaign.performance_health < 70 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Strategic Failure Detected</AlertTitle>
          <AlertDescription>
            Campaign health score of {campaign.performance_health}% indicates systematic issues requiring strategic intervention.
          </AlertDescription>
        </Alert>
      )}

      {/* Failure Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnosis">AI Diagnosis</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Library</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
        </TabsList>

        {/* AI Diagnosis Tab */}
        <TabsContent value="diagnosis" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 text-red-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Strategic Failure Analysis</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI analyzing failure patterns, root causes, and remediation strategies...
                    </p>
                  </div>
                  <Progress value={60} className="w-64 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Failure Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    Strategic Failure Diagnosis
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis with {analysis.confidence_score}% confidence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        ${analysis.impact_assessment.budget_waste}
                      </div>
                      <div className="text-sm text-muted-foreground">Budget Waste</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        +{analysis.impact_assessment.timeline_delay}d
                      </div>
                      <div className="text-sm text-muted-foreground">Timeline Delay</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        -{analysis.impact_assessment.kpi_shortfall}%
                      </div>
                      <div className="text-sm text-muted-foreground">KPI Shortfall</div>
                    </div>
                    <div className="text-center">
                      <Badge className={getImpactColor(analysis.impact_assessment.reputation_impact)}>
                        {analysis.impact_assessment.reputation_impact} reputation impact
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Root Causes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.root_causes.map((cause, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-red-800">{cause}</div>
                        {analysis.contributing_factors[i] && (
                          <div className="text-sm text-red-600 mt-1">
                            Contributing factor: {analysis.contributing_factors[i]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Lessons Learned */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Lessons Learned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.lessons_learned.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Template Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create Prevention Template</CardTitle>
                  <CardDescription>
                    Convert this failure analysis into a reusable prevention template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-notes">Additional Notes</Label>
                    <Textarea
                      id="template-notes"
                      placeholder="Add context, specific details, or team insights..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateTemplate}
                    disabled={analysis.template_created}
                    className="w-full gap-2"
                  >
                    {analysis.template_created ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Template Created
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Create Prevention Template
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No analysis available. Click refresh to run diagnosis.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pattern Library Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Pattern Library</CardTitle>
              <CardDescription>
                Common failure patterns across similar campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FAILURE_PATTERNS.map((pattern) => (
                <div
                  key={pattern.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPattern?.id === pattern.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPattern(selectedPattern?.id === pattern.id ? null : pattern)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{pattern.name}</h4>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(pattern.impact_level)}>
                        {pattern.impact_level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {pattern.frequency}% frequency
                      </Badge>
                    </div>
                  </div>

                  {selectedPattern?.id === pattern.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Warning Signs</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {pattern.warning_signs.map((sign, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 text-yellow-600 mt-1 shrink-0" />
                              {sign}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Recovery Success Rate: {pattern.success_rate}%</h5>
                        <Progress value={pattern.success_rate} className="h-2" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remediation Tab */}
        <TabsContent value="remediation" className="space-y-4">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Remediation Action Plan</CardTitle>
                <CardDescription>
                  Step-by-step recovery strategy based on failure analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.prevention_plan.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{action}</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          Start Action
                        </Button>
                        <Badge variant="secondary">
                          Status: {analysis.remediation_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Prevention Tab */}
        <TabsContent value="prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Future Prevention Strategies
              </CardTitle>
              <CardDescription>
                Systematic improvements to prevent similar failures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FAILURE_PATTERNS.slice(0, 2).map((pattern) => (
                <div key={pattern.id} className="space-y-3">
                  <h4 className="font-medium text-sm">{pattern.name} Prevention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        Prevention Strategies
                      </h5>
                      <ul className="space-y-1">
                        {pattern.prevention_strategies.map((strategy, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3 h-3 text-green-600 mt-1 shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        Recovery Actions
                      </h5>
                      <ul className="space-y-1">
                        {pattern.recovery_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Zap className="w-3 h-3 text-blue-600 mt-1 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
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