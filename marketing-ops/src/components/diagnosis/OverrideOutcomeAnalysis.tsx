import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Lightbulb,
  AlertCircle,
  Brain,
} from 'lucide-react'
import type { Campaign } from '@/types/campaign'
import type { OverrideEvent, Recommendation } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface OverrideOutcomeAnalysisProps {
  campaign: Campaign
  overrideEvent: OverrideEvent | null
}

export function OverrideOutcomeAnalysis({ campaign, overrideEvent }: OverrideOutcomeAnalysisProps) {
  const [aiRecommendation, setAiRecommendation] = useState<Recommendation | null>(null)

  useEffect(() => {
    async function fetchRecommendation() {
      if (overrideEvent?.recommendation_id) {
        const { data } = await supabase
          .from('recommendations')
          .select('*')
          .eq('id', overrideEvent.recommendation_id)
          .single()
        
        if (data) setAiRecommendation(data as Recommendation)
      }
    }
    fetchRecommendation()
  }, [overrideEvent])

  if (!campaign.gate_overridden || !overrideEvent) {
    return null
  }

  const isCompleted = campaign.status === 'completed'
  const hasOutcome = overrideEvent.outcome !== undefined

  const getOutcomeIcon = () => {
    switch (overrideEvent.outcome) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'partial_success':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Eye className="w-5 h-5 text-blue-600" />
    }
  }

  const getOutcomeBadgeVariant = () => {
    switch (overrideEvent.outcome) {
      case 'success':
        return 'success'
      case 'failure':
        return 'destructive'
      case 'partial_success':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getSystemCorrectnessMessage = () => {
    if (!overrideEvent.system_was_correct) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        text: 'Your judgment was correct',
        color: 'text-green-700 bg-green-50 border-green-200',
      }
    } else {
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        text: 'AI recommendation was correct',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Override Detection Alert */}
      <Alert className="border-purple-300 bg-purple-50">
        <Brain className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-900">AI Recommendation Override</AlertTitle>
        <AlertDescription className="text-purple-700">
          You chose to override an AI recommendation. 
          {!isCompleted && ' We\'re monitoring the outcome to improve future suggestions.'}
          {isCompleted && hasOutcome && ' Final outcome analysis is available below.'}
        </AlertDescription>
      </Alert>

      {/* AI Recommendation Details (if available) */}
      {aiRecommendation && (
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              AI Recommendation That Was Overridden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium text-sm">{aiRecommendation.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{aiRecommendation.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs capitalize">
                {aiRecommendation.tier} Priority
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {aiRecommendation.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {aiRecommendation.ai_confidence}% Confidence
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Override Decision Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Your Decision vs AI Recommendation
          </CardTitle>
          <CardDescription>
            Comparing AI suggestion with your actual decision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI vs User Decision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-sm text-purple-900 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Recommended:
              </h4>
              <Badge variant="outline" className="uppercase border-purple-300 text-purple-700">
                {overrideEvent.original_recommendation}
              </Badge>
              {overrideEvent.system_confidence && (
                <p className="text-xs text-purple-700 mt-2">
                  AI Confidence: {overrideEvent.system_confidence}%
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Your Decision:</h4>
              <Badge variant="default" className="uppercase bg-blue-600">
                {overrideEvent.user_action}
              </Badge>
              {overrideEvent.overridden_by && (
                <p className="text-xs text-blue-700 mt-2">
                  Decided by: {overrideEvent.overridden_by}
                </p>
              )}
              <p className="text-xs text-blue-700">
                Date: {new Date(overrideEvent.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* User's Reasoning */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Your Reasoning:</h4>
            <p className="text-sm text-gray-700 italic">
              "{overrideEvent.reason}"
            </p>
          </div>

          {/* Outcome (Only if campaign completed) */}
          {isCompleted && hasOutcome && (
            <>
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {getOutcomeIcon()}
                  <h3 className="font-semibold text-lg">Final Outcome</h3>
                  <Badge variant={getOutcomeBadgeVariant()} className="ml-auto">
                    {overrideEvent.outcome?.replace('_', ' ')}
                  </Badge>
                </div>

                {overrideEvent.outcome_explanation && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <h4 className="font-medium text-sm text-blue-900 mb-2">What Happened:</h4>
                    <p className="text-sm text-blue-700">
                      {overrideEvent.outcome_explanation}
                    </p>
                  </div>
                )}

                {/* AI Correctness Assessment */}
                {overrideEvent.system_was_correct !== null && overrideEvent.system_was_correct !== undefined && (
                  <div className={`p-4 rounded-lg border ${getSystemCorrectnessMessage().color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getSystemCorrectnessMessage().icon}
                      <h4 className="font-medium text-sm">
                        {getSystemCorrectnessMessage().text}
                      </h4>
                    </div>
                    {overrideEvent.lesson_learned && (
                      <p className="text-sm mt-2">
                        <strong>Lesson:</strong> {overrideEvent.lesson_learned}
                      </p>
                    )}
                  </div>
                )}

                {/* Overridden By */}
                {overrideEvent.overridden_by && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-muted-foreground">
                      Override decision by:{' '}
                      <strong className="text-foreground">{overrideEvent.overridden_by}</strong>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pending Outcome (Campaign in progress) */}
          {!isCompleted && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertTitle>Observation in Progress</AlertTitle>
              <AlertDescription>
                Campaign is currently running. Final outcome analysis will be available after completion.
                The system is monitoring performance to validate this override decision.
              </AlertDescription>
            </Alert>
          )}

          {/* Learning Impact */}
          {isCompleted && hasOutcome && overrideEvent.lesson_learned && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-purple-900 mb-1">
                    System Learning
                  </h4>
                  <p className="text-sm text-purple-700">
                    {overrideEvent.lesson_learned}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    This insight will be incorporated into future AI recommendations for similar campaigns.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
