import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  Shield,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Pause,
  WifiOff,
} from 'lucide-react'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { Recommendation as DBRecommendation, PerformanceMetric, RiskScore } from '@/types/database'
import { supabase } from '@/lib/supabase'
import {
  generateTacticalRecommendations,
  generateStrategicRecommendations,
  isApiKeyConfigured,
} from '@/services/aiService'
import { generateImmediateRecommendations } from '@/utils/immediateRecommendations'

type Tier = 'immediate' | 'tactical' | 'strategic'

interface DisplayRecommendation {
  id: string
  dbId?: string // ID from database if persisted
  title: string
  description: string
  tier: Tier
  category: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  confidence: number
  reasoning: string
  implementationSteps: string[]
  estimatedOutcome: string
  status: 'suggested' | 'accepted' | 'rejected' | 'deferred' | 'completed'
  aiModel?: string
  createdAt: string
}

interface AIEngineProps {
  campaign: Campaign
  phases: ExecutionPhase[]
  driftEvents: DriftEvent[]
  onApplyRecommendation?: (recommendation: DisplayRecommendation) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  budget: <DollarSign className="w-4 h-4" />,
  creative: <Zap className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  targeting: <Target className="w-4 h-4" />,
  performance: <TrendingUp className="w-4 h-4" />,
  risk: <Shield className="w-4 h-4" />,
}

export default function AIRecommendationsEngine({
  campaign,
  phases,
  driftEvents,
  onApplyRecommendation,
}: AIEngineProps) {
  const [recommendations, setRecommendations] = useState<DisplayRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all')
  const [aiAvailable, setAiAvailable] = useState(true)
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false)

  // Reject dialog state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Feedback dialog state
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [effectivenessRating, setEffectivenessRating] = useState(3)

  // Load existing recommendations from database on mount
  useEffect(() => {
    loadExistingRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id])

  const loadExistingRecommendations = async () => {
    try {
      const { data } = await supabase
        .from('recommendations')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const mapped: DisplayRecommendation[] = data.map((r: DBRecommendation) => ({
          id: r.id,
          dbId: r.id,
          title: r.title,
          description: r.description,
          tier: r.tier,
          category: r.category || 'performance',
          impact: (r.estimated_impact as 'high' | 'medium' | 'low') || 'medium',
          effort: (r.estimated_effort as 'low' | 'medium' | 'high') || 'medium',
          confidence: r.confidence_score ?? r.ai_confidence ?? 70,
          reasoning: r.implementation_notes || '',
          implementationSteps: r.implementation_steps || [],
          estimatedOutcome: '',
          status: r.status || 'suggested',
          aiModel: r.ai_model || undefined,
          createdAt: r.created_at,
        }))
        setRecommendations(mapped)
        setLastUpdate(new Date(data[0].created_at))
        setHasLoadedFromDb(true)
        return
      }
    } catch (error) {
      console.error('Failed to load recommendations from DB:', error)
    }
    setHasLoadedFromDb(true)
  }

  const persistRecommendations = useCallback(async (recs: DisplayRecommendation[]) => {
    try {
      // Simple approach: Delete all 'suggested' status recommendations and insert fresh ones
      // This ensures we always have the latest generated recommendations
      // Keep other statuses (accepted, rejected, etc.) intact
      const { error: deleteError } = await supabase
        .from('recommendations')
        .delete()
        .eq('campaign_id', campaign.id)
        .eq('status', 'suggested')

      if (deleteError) {
        console.error('Failed to delete old recommendations:', deleteError)
      }

      // Insert all new recommendations
      const rows = recs.map(r => ({
        campaign_id: campaign.id,
        tier: r.tier,
        category: r.category,
        title: r.title,
        description: r.description,
        implementation_steps: r.implementationSteps,
        estimated_effort: r.effort,
        estimated_impact: r.impact,
        confidence_score: r.confidence, // 0-100 integer
        status: 'suggested' as const,
        generated_by: 'system',
        ai_model: r.aiModel || null,
        ai_confidence: r.aiModel ? r.confidence / 100 : null, // ai_confidence might be decimal 0-1
        implementation_notes: r.reasoning,
      }))

      const { data: insertedData, error: insertError } = await supabase
        .from('recommendations')
        .insert(rows)
        .select('id')

      if (insertError) {
        console.error('Failed to insert recommendations:', insertError)
        return
      }

      // Map DB IDs back to display recommendations
      if (insertedData) {
        const updatedRecs = recs.map((rec, i) => ({
          ...rec,
          dbId: insertedData[i]?.id || rec.dbId,
        }))
        setRecommendations(updatedRecs)
        console.log(`✅ Persisted ${insertedData.length} recommendations to database`)
      }
    } catch (error) {
      console.error('Failed to persist recommendations:', error)
    }
  }, [campaign.id])

  const generateAllRecommendations = useCallback(async () => {
    setLoading(true)
    setLoadingMessage('Analyzing campaign data...')

    try {
      // Fetch additional data from Supabase
      const [metricsRes, riskRes] = await Promise.all([
        supabase
          .from('performance_metrics')
          .select('*')
          .eq('campaign_id', campaign.id)
          .order('metric_date'),
        supabase
          .from('risk_scores')
          .select('*')
          .eq('campaign_id', campaign.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])

      const performanceMetrics: PerformanceMetric[] = metricsRes.data || []
      const riskScore: RiskScore | null = riskRes.data?.[0] || null

      // 1. Generate IMMEDIATE recommendations (formula-based, instant)
      setLoadingMessage('Calculating immediate recommendations...')
      const immediateRaw = generateImmediateRecommendations(
        campaign,
        phases,
        driftEvents,
        riskScore,
      )
      const immediateRecs: DisplayRecommendation[] = immediateRaw.map((r, i) => ({
        id: `imm-${Date.now()}-${i}`,
        title: r.title,
        description: r.description,
        tier: 'immediate' as Tier,
        category: r.category,
        impact: r.impact,
        effort: r.effort,
        confidence: r.confidence,
        reasoning: r.reasoning,
        implementationSteps: r.implementationSteps,
        estimatedOutcome: r.estimatedOutcome,
        status: 'suggested',
        createdAt: new Date().toISOString(),
      }))

      // 2. Generate TACTICAL + STRATEGIC via AI (parallel)
      let tacticalRecs: DisplayRecommendation[] = []
      let strategicRecs: DisplayRecommendation[] = []

      if (isApiKeyConfigured()) {
        setLoadingMessage('Generating AI-powered tactical recommendations...')
        const context = { campaign, phases, driftEvents, performanceMetrics, riskScore }

        try {
          const [tacticalRaw, strategicRaw] = await Promise.all([
            generateTacticalRecommendations(context),
            generateStrategicRecommendations(context),
          ])

          tacticalRecs = tacticalRaw.map((r, i) => ({
            id: `tac-${Date.now()}-${i}`,
            title: r.title,
            description: r.description,
            tier: 'tactical' as Tier,
            category: r.category,
            impact: r.impact,
            effort: r.effort,
            confidence: r.confidence,
            reasoning: r.reasoning,
            implementationSteps: r.implementationSteps,
            estimatedOutcome: r.estimatedOutcome,
            status: 'suggested',
            aiModel: 'groq-llama-3.3',
            createdAt: new Date().toISOString(),
          }))

          strategicRecs = strategicRaw.map((r, i) => ({
            id: `str-${Date.now()}-${i}`,
            title: r.title,
            description: r.description,
            tier: 'strategic' as Tier,
            category: r.category,
            impact: r.impact,
            effort: r.effort,
            confidence: r.confidence,
            reasoning: r.reasoning,
            implementationSteps: r.implementationSteps,
            estimatedOutcome: r.estimatedOutcome,
            status: 'suggested',
            aiModel: 'groq-llama-3.3',
            createdAt: new Date().toISOString(),
          }))

          setAiAvailable(true)
        } catch (error) {
          console.error('AI recommendations failed:', error)
          setAiAvailable(false)
        }
      } else {
        setAiAvailable(false)
      }

      const allRecs = [...immediateRecs, ...tacticalRecs, ...strategicRecs]
      setRecommendations(allRecs)
      setLastUpdate(new Date())

      // 3. Persist to database
      setLoadingMessage('Saving recommendations...')
      await persistRecommendations(allRecs)
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }, [campaign, phases, driftEvents, persistRecommendations])

  const updateRecommendationStatus = async (
    recId: string,
    dbId: string | undefined,
    status: DisplayRecommendation['status'],
    extra?: Record<string, unknown>,
  ) => {
    // Update local state
    setRecommendations(prev =>
      prev.map(r =>
        r.id === recId ? { ...r, status } : r
      )
    )

    // Update in database
    if (dbId) {
      try {
        const updateData: Record<string, unknown> = { status, ...extra }
        if (status === 'accepted') updateData.accepted_at = new Date().toISOString()
        if (status === 'completed') updateData.completed_at = new Date().toISOString()

        await supabase
          .from('recommendations')
          .update(updateData)
          .eq('id', dbId)
      } catch (error) {
        console.error('Failed to update recommendation status:', error)
      }
    }
  }

  const handleAccept = (rec: DisplayRecommendation) => {
    updateRecommendationStatus(rec.id, rec.dbId, 'accepted')
    onApplyRecommendation?.(rec)
  }

  const handleReject = (rec: DisplayRecommendation) => {
    setRejectingId(rec.id)
    setRejectReason('')
  }

  const confirmReject = () => {
    if (!rejectingId) return
    const rec = recommendations.find(r => r.id === rejectingId)
    if (rec) {
      updateRecommendationStatus(rec.id, rec.dbId, 'rejected', {
        rejected_reason: rejectReason,
      })
    }
    setRejectingId(null)
    setRejectReason('')
  }

  const handleDefer = (rec: DisplayRecommendation) => {
    updateRecommendationStatus(rec.id, rec.dbId, 'deferred')
  }

  const handleComplete = (rec: DisplayRecommendation) => {
    setCompletingId(rec.id)
    setFeedbackText('')
    setEffectivenessRating(3)
  }

  const confirmComplete = () => {
    if (!completingId) return
    const rec = recommendations.find(r => r.id === completingId)
    if (rec) {
      updateRecommendationStatus(rec.id, rec.dbId, 'completed', {
        outcome_feedback: feedbackText,
        effectiveness_rating: effectivenessRating,
      })
    }
    setCompletingId(null)
    setFeedbackText('')
  }

  const getFilteredRecommendations = () => {
    if (activeTier === 'all') return recommendations
    return recommendations.filter(r => r.tier === activeTier)
  }

  const tierCounts = {
    all: recommendations.length,
    immediate: recommendations.filter(r => r.tier === 'immediate').length,
    tactical: recommendations.filter(r => r.tier === 'tactical').length,
    strategic: recommendations.filter(r => r.tier === 'strategic').length,
  }

  const actionRequiredCount = recommendations.filter(
    r => r.tier === 'immediate' && r.status === 'suggested'
  ).length

  const getTierColor = (tier: Tier) => {
    switch (tier) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200'
      case 'tactical': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'strategic': return 'bg-purple-100 text-purple-800 border-purple-200'
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

  const getStatusBadge = (status: DisplayRecommendation['status']) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>
      case 'deferred':
        return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Deferred</Badge>
      case 'completed':
        return <Badge className="bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category.toLowerCase()] || <Sparkles className="w-4 h-4" />
  }

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
                  {aiAvailable
                    ? 'Powered by Groq AI + Formula-Based Analysis'
                    : 'Formula-Based Analysis (AI unavailable — add VITE_GROQ_API_KEY to .env)'}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAllRecommendations}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {hasLoadedFromDb && recommendations.length > 0 ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tierCounts.all}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{tierCounts.immediate}</div>
              <div className="text-sm text-muted-foreground">Immediate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tierCounts.tactical}</div>
              <div className="text-sm text-muted-foreground">Tactical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{tierCounts.strategic}</div>
              <div className="text-sm text-muted-foreground">Strategic</div>
            </div>
          </div>

          {lastUpdate && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Unavailable Warning */}
      {!aiAvailable && hasLoadedFromDb && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>AI Recommendations Unavailable</AlertTitle>
          <AlertDescription>
            Groq API key not configured. Tactical and Strategic tiers require AI.
            Add <code className="bg-gray-100 px-1 rounded">VITE_GROQ_API_KEY</code> to your <code className="bg-gray-100 px-1 rounded">.env</code> file.
            Immediate recommendations still work using formula-based analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Loaded from DB indicator */}
      {hasLoadedFromDb && recommendations.length > 0 && lastUpdate && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Recommendations Loaded</AlertTitle>
          <AlertDescription>
            {recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''} loaded from database.
            Last generated: {lastUpdate.toLocaleString()}.
            Click "Regenerate" to get fresh recommendations based on current campaign data.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Required Alert */}
      {actionRequiredCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Immediate Action Required</AlertTitle>
          <AlertDescription>
            {actionRequiredCount} immediate recommendation{actionRequiredCount > 1 ? 's' : ''} need attention to prevent performance degradation.
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Tabs */}
      <Tabs value={activeTier} onValueChange={(v) => setActiveTier(v as Tier | 'all')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({tierCounts.all})</TabsTrigger>
          <TabsTrigger value="immediate">Immediate ({tierCounts.immediate})</TabsTrigger>
          <TabsTrigger value="tactical">Tactical ({tierCounts.tactical})</TabsTrigger>
          <TabsTrigger value="strategic">Strategic ({tierCounts.strategic})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTier} className="space-y-4">
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
                      {loadingMessage || 'Analyzing campaign data and generating recommendations...'}
                    </p>
                  </div>
                  <Progress value={65} className="w-64 mx-auto" />
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
                    <h3 className="font-medium text-gray-900">
                      {recommendations.length === 0
                        ? 'No Recommendations Yet'
                        : 'No Recommendations in This Tier'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendations.length === 0
                        ? 'Click "Generate" to analyze campaign data and produce recommendations.'
                        : 'All recommendations in other tiers. Switch tabs to view them.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredRecommendations().map((rec) => {
                const isActioned = rec.status !== 'suggested'

                return (
                  <Card key={rec.id} className={isActioned ? 'opacity-70' : ''}>
                    <CardContent className="pt-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            {getCategoryIcon(rec.category)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{rec.title}</h4>
                              {isActioned && getStatusBadge(rec.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={getTierColor(rec.tier)}>
                            {rec.tier}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(rec.impact)}>
                            {rec.impact} impact
                          </Badge>
                          <Badge className={getEffortColor(rec.effort)}>
                            {rec.effort} effort
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Sparkles className="w-3 h-3" />
                          {rec.confidence}% confidence
                        </div>
                        {rec.aiModel && (
                          <div className="text-xs text-muted-foreground">
                            AI: {rec.aiModel}
                          </div>
                        )}
                      </div>

                      {/* AI Reasoning */}
                      {rec.reasoning && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-blue-900 mb-1">
                              {rec.aiModel ? 'AI Analysis:' : 'Analysis:'}
                            </div>
                            <div className="text-blue-800">{rec.reasoning}</div>
                          </div>
                        </div>
                      )}

                      {/* Expected Outcome */}
                      {rec.estimatedOutcome && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-green-900 mb-1">Expected Outcome:</div>
                            <div className="text-green-800">{rec.estimatedOutcome}</div>
                          </div>
                        </div>
                      )}

                      {/* Implementation Steps */}
                      {rec.implementationSteps.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Implementation Steps:</h5>
                          <ol className="text-sm text-muted-foreground space-y-1">
                            {rec.implementationSteps.map((step, i) => (
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
                          {rec.tier === 'immediate' && rec.status === 'suggested' && (
                            <span className="text-red-600 font-medium">Action required</span>
                          )}
                          {rec.status === 'accepted' && (
                            <span className="text-green-600">Accepted — implement when ready</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {rec.status === 'suggested' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDefer(rec)}
                                className="gap-1"
                              >
                                <Pause className="w-3 h-3" />
                                Defer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(rec)}
                                className="gap-1 text-red-600 hover:text-red-700"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(rec)}
                                className="gap-1"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                Accept
                              </Button>
                            </>
                          )}
                          {rec.status === 'accepted' && (
                            <Button
                              size="sm"
                              className="gap-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleComplete(rec)}
                            >
                              <CheckCircle className="w-3 h-3" />
                              Mark Complete
                            </Button>
                          )}
                          {rec.status === 'deferred' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAccept(rec)}
                              className="gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Revisit
                            </Button>
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

      {/* Reject Reason Dialog */}
      <Dialog open={rejectingId !== null} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Recommendation</DialogTitle>
            <DialogDescription>
              Why are you rejecting this recommendation? This helps improve future suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason (optional)</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Not applicable to our situation, already tried this..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Feedback Dialog */}
      <Dialog open={completingId !== null} onOpenChange={(open) => !open && setCompletingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogDescription>
              How effective was this recommendation? Your feedback improves future suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Effectiveness (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <Button
                    key={n}
                    variant={effectivenessRating === n ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEffectivenessRating(n)}
                    className="w-10 h-10"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Outcome feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="What was the result of implementing this recommendation?"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingId(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmComplete}>
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
