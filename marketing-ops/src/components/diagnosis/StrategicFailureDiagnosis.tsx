import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Lightbulb,
  Target,
  Zap,
  Brain,
  FlaskConical,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { StrategicFailure, ABTestSuggestion } from '@/types/database'

interface StrategicFailureDiagnosisProps {
  campaign: Campaign
  phases: ExecutionPhase[]
  driftEvents: DriftEvent[]
  onCreateTemplate?: (diagnosis: StrategicFailure) => void
}

export default function StrategicFailureDiagnosis({ 
  campaign, 
  phases, 
  // driftEvents and onCreateTemplate available for future use
  // driftEvents,
  // onCreateTemplate 
}: StrategicFailureDiagnosisProps) {
  const [strategicFailure, setStrategicFailure] = useState<StrategicFailure | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('diagnosis')

  // Fetch strategic failure data from database
  useEffect(() => {
    async function fetchStrategicFailure() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('strategic_failures')
          .select('*')
          .eq('campaign_id', campaign.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching strategic failure:', error)
        } else if (data) {
          setStrategicFailure(data as StrategicFailure)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStrategicFailure()
  }, [campaign.id])

  // Calculate if campaign qualifies for strategic failure detection
  const qualifiesForDiagnosis = () => {
    // Per spec: drift < 1 day BUT performance < 70% target
    const avgDrift = phases
      .filter(p => p.status === 'completed' && p.drift_days !== null)
      .reduce((sum, p) => sum + Math.abs(p.drift_days || 0), 0) / Math.max(phases.filter(p => p.status === 'completed').length, 1)
    
    const performanceHealth = campaign.performance_health || 100
    
    // Strategic failure: clean execution (low drift) but poor performance
    return avgDrift < 1 && performanceHealth < 70
  }

  const getHypothesisRanking = () => {
    if (!strategicFailure) return []
    
    return [
      { name: 'Creative Issues', score: strategicFailure.creative_hypothesis_score || 0, icon: Lightbulb },
      { name: 'Targeting Mismatch', score: strategicFailure.targeting_hypothesis_score || 0, icon: Target },
      { name: 'Timing Problems', score: strategicFailure.timing_hypothesis_score || 0, icon: AlertTriangle },
      { name: 'Value Proposition', score: strategicFailure.value_prop_hypothesis_score || 0, icon: Zap },
    ].sort((a, b) => b.score - a.score)
  }

  const getDiagnosisColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-700 bg-green-100 border-green-200'
    if (confidence >= 0.6) return 'text-yellow-700 bg-yellow-100 border-yellow-200'
    return 'text-orange-700 bg-orange-100 border-orange-200'
  }

  const formatPrimaryDiagnosis = (diagnosis: string) => {
    return diagnosis.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Loading Diagnosis...</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Analyzing strategic failure patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no strategic failure exists and doesn't qualify
  if (!strategicFailure && !qualifiesForDiagnosis()) {
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
                Campaign execution and performance are within acceptable parameters.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Strategic failure detection triggers when: drift {'<'} 1 day AND performance {'<'} 70% target
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If qualifies but no diagnosis exists yet, show detection trigger
  if (!strategicFailure && qualifiesForDiagnosis()) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Strategic Failure Detected</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Campaign launched on time (low drift) but performance is below 70% of target. 
            This indicates a strategic issue rather than operational execution problem.
          </p>
          <Button variant="outline" size="sm" className="mt-2">
            Generate AI Diagnosis
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!strategicFailure) return null

  const hypotheses = getHypothesisRanking()
  const abTestSuggestions = strategicFailure.ab_test_suggestions || []

  return (
    <div className="space-y-6">
      {/* Detection Alert */}
      <Alert variant="destructive">
        <TrendingDown className="h-4 w-4" />
        <AlertTitle>Strategic Failure Identified</AlertTitle>
        <AlertDescription>
          <strong>Detection Criteria:</strong> {strategicFailure.detection_criteria}
        </AlertDescription>
      </Alert>

      {/* Main Diagnosis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="hypotheses">Hypotheses</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
        </TabsList>

        {/* Diagnosis Tab */}
        <TabsContent value="diagnosis" className="space-y-4">
          {/* Primary Diagnosis Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-red-600" />
                    Primary Diagnosis
                  </CardTitle>
                  <CardDescription className="mt-1">
                    AI-powered analysis using {strategicFailure.ai_model_used || 'system analysis'}
                  </CardDescription>
                </div>
                <Badge className={getDiagnosisColor(strategicFailure.diagnosis_confidence)}>
                  {Math.round(strategicFailure.diagnosis_confidence * 100)}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-lg text-red-900">
                  {formatPrimaryDiagnosis(strategicFailure.primary_diagnosis)}
                </h3>
                {strategicFailure.ai_analysis && (
                  <p className="text-sm text-red-700 mt-2">
                    {strategicFailure.ai_analysis}
                  </p>
                )}
              </div>

              {/* Evidence Points */}
              {strategicFailure.evidence_points && strategicFailure.evidence_points.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Supporting Evidence:</h4>
                  <div className="space-y-2">
                    {strategicFailure.evidence_points.map((evidence, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                        <span>{evidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {strategicFailure.recommended_actions && strategicFailure.recommended_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Recommended Actions:
                  </h4>
                  <div className="space-y-2">
                    {strategicFailure.recommended_actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prevention Strategies */}
              {strategicFailure.prevention_strategies && strategicFailure.prevention_strategies.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Future Prevention:
                  </h4>
                  <div className="space-y-2">
                    {strategicFailure.prevention_strategies.map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson Learned */}
              {strategicFailure.lesson_learned && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-sm text-blue-900 mb-1">Key Lesson:</h4>
                  <p className="text-sm text-blue-700">{strategicFailure.lesson_learned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hypotheses Tab */}
        <TabsContent value="hypotheses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranked Failure Hypotheses</CardTitle>
              <CardDescription>
                Multiple potential root causes ranked by likelihood
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hypotheses.map((hypothesis, index) => {
                const Icon = hypothesis.icon
                const isPrimary = index === 0
                
                return (
                  <div
                    key={hypothesis.name}
                    className={`p-4 rounded-lg border-2 ${
                      isPrimary 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPrimary ? 'bg-red-200' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-4 h-4 ${isPrimary ? 'text-red-700' : 'text-gray-700'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{hypothesis.name}</h3>
                          {isPrimary && (
                            <Badge variant="destructive" className="mt-1">
                              Primary Hypothesis
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {hypothesis.score}
                        </div>
                        <div className="text-xs text-muted-foreground">Likelihood</div>
                      </div>
                    </div>
                    <Progress value={hypothesis.score} className="h-2" />
                  </div>
                )
              })}

              {/* Interpretation Guide */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-900 mb-2">How to Interpret:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>80-100:</strong> Highly likely root cause - prioritize testing</li>
                  <li>• <strong>60-79:</strong> Strong contributor - secondary testing</li>
                  <li>• <strong>40-59:</strong> Possible factor - monitor closely</li>
                  <li>• <strong>Below 40:</strong> Less likely but not ruled out</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Test Recommendations Tab */}
        <TabsContent value="abtests" className="space-y-4">
          {abTestSuggestions.length > 0 ? (
            <div className="space-y-4">
              {abTestSuggestions.map((test: ABTestSuggestion, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FlaskConical className="w-4 h-4" />
                          {test.test_type}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {test.hypothesis}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {test.recommended_duration_days} days
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Test Setup */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Control Variant</h4>
                        <p className="text-sm text-muted-foreground">{test.control_variant}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm mb-2">Test Variant</h4>
                        <p className="text-sm text-blue-700">{test.test_variant}</p>
                      </div>
                    </div>

                    {/* Setup Instructions */}
                    {test.setup_instructions && test.setup_instructions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Setup Instructions:</h4>
                        <ol className="space-y-2">
                          {test.setup_instructions.map((instruction: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Success Criteria */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-sm text-green-900 mb-1">
                        Success Criteria:
                      </h4>
                      <p className="text-sm text-green-700">{test.success_criteria}</p>
                    </div>

                    {/* Expected Impact */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Expected Impact: </span>
                        <span className="font-medium">{test.expected_impact}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={test.confidence_level * 100} className="w-24 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(test.confidence_level * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Set Up This Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <FlaskConical className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="font-medium text-gray-900">No A/B Test Suggestions</h3>
                  <p className="text-sm text-muted-foreground">
                    A/B test recommendations will be generated based on the diagnosis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolution Status */}
      {strategicFailure.resolved && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              Strategic Failure Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicFailure.resolution_date && (
                <p className="text-sm text-green-700">
                  Resolved on {new Date(strategicFailure.resolution_date).toLocaleDateString()}
                </p>
              )}
              {strategicFailure.resolution_actions && strategicFailure.resolution_actions.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-green-900 mb-2">Actions Taken:</h4>
                  <ul className="space-y-1">
                    {strategicFailure.resolution_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
