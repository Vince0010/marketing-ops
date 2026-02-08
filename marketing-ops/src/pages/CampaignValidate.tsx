import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import { getGateDecision, calculateDetailedRiskScore, type RiskAssessment, type RiskFactorResult } from '@/utils/calculations'
import { formatCurrency } from '@/utils/formatting'
import { DecisionStatusBadge } from '@/components/DecisionStatusBadge'

interface RiskFactor {
  name: string
  score: number
  status: 'pass' | 'warn' | 'fail'
  detail: string
  icon: React.ReactNode
}

export default function CampaignValidate() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
<<<<<<< HEAD
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)
=======
  const [, setOverrideAction] = useState<'proceed' | 'adjust' | 'pause'>('proceed')
>>>>>>> 1fe4725 (Added Components)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignRes, phasesRes, capacityRes] = await Promise.all([
          supabase.from('campaigns').select('*').eq('id', id).single(),
          supabase.from('execution_phases').select('*').eq('campaign_id', id).order('phase_number'),
          supabase
            .from('team_capacity')
            .select('*, team_members!inner(name)')
            .eq('campaign_id', id)
        ])

        if (campaignRes.data) {
          setCampaign(campaignRes.data)
          // Calculate risk assessment with real data
          const overloadedCount = (capacityRes.data || []).filter(
            (cap) => cap.utilization_percentage && cap.utilization_percentage > 90
          ).length
          const assessment = calculateDetailedRiskScore(
            campaignRes.data,
            phasesRes.data || [],
            overloadedCount
          )
          setRiskAssessment(assessment)
          
          // Save risk score to database
          await saveRiskScore(campaignRes.data.id, assessment)
          
          // Update campaign with new risk score
          await supabase
            .from('campaigns')
            .update({ risk_score: assessment.overallScore })
            .eq('id', campaignRes.data.id)
        }
        
        if (phasesRes.data) setPhases(phasesRes.data)
      } catch (error) {
        console.error('Error fetching campaign:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const saveRiskScore = async (campaignId: string, assessment: RiskAssessment) => {
    try {
      await supabase.from('risk_scores').upsert({
        campaign_id: campaignId,
        overall_score: assessment.overallScore,
        risk_level: assessment.riskLevel,
        timeline_risk: assessment.factors.find((f: RiskFactorResult) => f.name === 'Timeline Feasibility')?.score,
        budget_risk: assessment.factors.find((f: RiskFactorResult) => f.name === 'Budget Adequacy')?.score,
        resource_risk: assessment.factors.find((f: RiskFactorResult) => f.name === 'Team Capacity')?.score,
        performance_risk: assessment.factors.find((f: RiskFactorResult) => f.name === 'Historical Performance')?.score,
        risk_factors: assessment.factors.filter((f: RiskFactorResult) => f.status !== 'pass').map((f: RiskFactorResult) => f.name),
        mitigation_suggestions: assessment.mitigationSuggestions,
        gate_recommendation: assessment.gateRecommendation,
        gate_reason: assessment.gateReason,
        calculated_by: 'system',
        calculated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving risk score:', error)
    }
  }

  // Use calculated risk score from assessment
  const riskScore = riskAssessment?.overallScore ?? campaign?.risk_score ?? 75
  const gateDecision = riskAssessment?.gateRecommendation ?? getGateDecision(riskScore)

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    if (score >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRiskBg = (score: number) => {
    if (score >= 70) return 'bg-green-100'
    if (score >= 50) return 'bg-yellow-100'
    if (score >= 30) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'Low Risk'
    if (score >= 50) return 'Medium Risk'
    if (score >= 30) return 'High Risk'
    return 'Critical Risk'
  }

  const getRiskBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 70) return 'default'
    if (score >= 50) return 'secondary'
    return 'destructive'
  }

  // Generate risk factors from calculated assessment
  const riskFactors: RiskFactor[] = riskAssessment?.factors.map((factor: RiskFactorResult) => ({
    name: factor.name,
    score: factor.score,
    status: factor.status,
    detail: factor.detail,
    icon: factor.name === 'Budget Adequacy' ? <DollarSign className="w-5 h-5" />
      : factor.name === 'Timeline Feasibility' ? <Clock className="w-5 h-5" />
      : factor.name === 'Team Capacity' ? <Users className="w-5 h-5" />
      : factor.name === 'Historical Performance' ? <TrendingUp className="w-5 h-5" />
      : <Zap className="w-5 h-5" />
  })) ?? [
    // Fallback for when assessment is not loaded yet
    {
      name: 'Risk Assessment Loading...',
      score: 0,
      status: 'warn' as const,
      detail: 'Calculating risk factors...',
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ]

  const handleDecision = async (decision: 'proceed' | 'adjust' | 'pause', overridden = false) => {
    try {
      const updates: Record<string, unknown> = {
        gate_status: decision,
        gate_overridden: overridden,
        status: decision === 'proceed' ? 'validated' : decision === 'pause' ? 'paused' : 'planning',
      }
      if (overridden && overrideReason) {
        updates.override_reason = overrideReason
      }

      await supabase.from('campaigns').update(updates).eq('id', id)

      // Insert override event if decision was overridden
      if (overridden && riskAssessment) {
        await supabase.from('override_events').insert({
          campaign_id: id,
          override_type: 'gate_decision',
          original_recommendation: riskAssessment.gateRecommendation,
          user_action: decision,
          reason: overrideReason,
          system_confidence: 100 - riskAssessment.overallScore, // Convert risk to confidence
          risk_score_at_time: riskAssessment.overallScore,
          overridden_by: 'current_user' // TODO: Get from auth context
        })
      }

      if (decision === 'proceed') {
        navigate(`/campaigns/${id}/tracker`)
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error updating decision:', error)
    }
  }

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
          <h1 className="text-3xl font-bold">Pre-Launch Validation</h1>
          <p className="text-muted-foreground mt-1">{campaign?.name || `Campaign ${id}`}</p>
        </div>
        <Badge variant={getRiskBadgeVariant(riskScore)} className="text-sm px-3 py-1">
          <Shield className="w-4 h-4 mr-1" />
          {getRiskLabel(riskScore)}
        </Badge>
      </div>

      {/* Alert banner for high-risk campaigns */}
      {riskScore < 50 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Risk Detected</AlertTitle>
          <AlertDescription>
            This campaign has a risk score of {riskScore}/100. Review the factors below before proceeding.
            An override with justification is required to launch.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Gauge */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>AI-powered risk analysis across 5 dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Gauge */}
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full ${getRiskBg(riskScore)} mb-3`}>
                  <span className={`text-4xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}</span>
                </div>
                <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                <Badge variant={getRiskBadgeVariant(riskScore)} className="mt-2">
                  {getRiskLabel(riskScore)}
                </Badge>
              </div>
            </div>

            {/* Risk score bar - styled Progress as gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Critical</span>
                <span>High</span>
                <span>Medium</span>
                <span>Low</span>
              </div>
              <div className="relative h-4 rounded-full overflow-hidden bg-gray-100">
                {/* Color zones */}
                <div className="absolute inset-0 flex">
                  <div className="w-[30%] bg-red-200" />
                  <div className="w-[20%] bg-orange-200" />
                  <div className="w-[20%] bg-yellow-200" />
                  <div className="w-[30%] bg-green-200" />
                </div>
                {/* Score marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-gray-900 rounded-full"
                  style={{ left: `${riskScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span>0</span>
                <span>30</span>
                <span>50</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>

            <Separator />

            {/* Risk Factors Breakdown */}
            <div className="space-y-4">
              {riskFactors.map((factor) => (
                <div key={factor.name} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 ${
                      factor.status === 'pass'
                        ? 'text-green-600'
                        : factor.status === 'warn'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {factor.status === 'pass' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : factor.status === 'warn' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{factor.name}</p>
                      <span
                        className={`text-sm font-semibold ${
                          factor.score >= 70
                            ? 'text-green-600'
                            : factor.score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {factor.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{factor.detail}</p>
                    <Progress value={factor.score} className="h-1.5 mt-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign Details Summary */}
            {campaign && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budget</span>
                    <p className="font-semibold">{formatCurrency(campaign.total_budget)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-semibold">{campaign.campaign_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KPI</span>
                    <p className="font-semibold">{campaign.primary_kpi}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phases</span>
                    <p className="font-semibold">{phases.length} defined</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Decision Gate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Decision Gate
            </CardTitle>
            <CardDescription>
              AI recommendation: <span className="font-semibold capitalize">{gateDecision}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Decision status badge - prominent above actions */}
            <div className="flex justify-center">
              <DecisionStatusBadge
                decision={gateDecision}
                showSublabel
                prominent
              />
            </div>
            <div
              className={`p-4 rounded-lg text-center ${
                gateDecision === 'proceed'
                  ? 'bg-green-50 border border-green-200'
                  : gateDecision === 'adjust'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className="text-sm font-medium">
                {gateDecision === 'proceed' && 'Campaign is ready to launch'}
                {gateDecision === 'adjust' && 'Adjustments recommended before launch'}
                {gateDecision === 'pause' && 'Campaign needs significant changes'}
              </p>
            </div>

            <div className="space-y-2">
              {/* Proceed button */}
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => handleDecision('proceed')}
                disabled={riskScore < 50}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Proceed
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Override Dialog for blocked decisions */}
              {riskScore < 50 && (
                <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2" size="lg">
                      <AlertTriangle className="w-4 h-4" />
                      Override & Proceed
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Override Risk Assessment</DialogTitle>
                      <DialogDescription>
                        The risk score of {riskScore}/100 is below the safe threshold. Provide a
                        justification to override.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          Overriding the risk gate will be logged and attributed to your account.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2">
                        <Label htmlFor="override-reason">Justification (required)</Label>
                        <Textarea
                          id="override-reason"
                          placeholder="Explain why this campaign should proceed despite the risk assessment..."
                          rows={4}
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={!overrideReason.trim()}
                        onClick={() => {
                          setOverrideDialogOpen(false)
                          handleDecision('proceed', true)
                        }}
                      >
                        Confirm Override
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Adjust */}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleDecision('adjust')}
              >
                Request Changes
              </Button>

              {/* Reject */}
              <Button className="w-full" variant="destructive" onClick={() => handleDecision('pause')}>
                Reject Campaign
              </Button>
            </div>

            <Separator />

            {/* Phase checklist */}
            {phases.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Execution Phases</p>
                {phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{phase.phase_name}</span>
                    <span className="text-muted-foreground ml-auto">{phase.planned_duration_days}d</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
