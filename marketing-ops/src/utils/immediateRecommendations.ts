import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { RiskScore } from '@/types/database'

export interface ImmediateRecommendation {
  title: string
  description: string
  category: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  confidence: number
  reasoning: string
  implementationSteps: string[]
  estimatedOutcome: string
}

export function generateImmediateRecommendations(
  campaign: Campaign,
  phases: ExecutionPhase[],
  driftEvents: DriftEvent[],
  riskScore: RiskScore | null,
): ImmediateRecommendation[] {
  const recommendations: ImmediateRecommendation[] = []

  const completedPhases = phases.filter(p => p.status === 'completed')
  const blockedPhases = phases.filter(p => p.status === 'blocked')
  const pendingPhases = phases.filter(p => p.status === 'pending')

  const avgDrift = completedPhases.length > 0
    ? completedPhases.reduce((s, p) => s + (p.drift_days || 0), 0) / completedPhases.length
    : 0

  const negativeDrifts = driftEvents.filter(d => d.drift_type === 'negative')
  const totalNegativeDrift = negativeDrifts.reduce((s, d) => s + Math.abs(d.drift_days), 0)

  // 1. High average drift — compress remaining phases
  if (avgDrift > 2 && pendingPhases.length > 0) {
    const remainingPhaseNames = pendingPhases.map(p => p.phase_name).join(', ')
    recommendations.push({
      title: 'Compress remaining phase timelines',
      description: `Average drift of +${avgDrift.toFixed(1)} days across completed phases. ${pendingPhases.length} phases remaining (${remainingPhaseNames}) should be compressed to recover lost time.`,
      category: 'timeline',
      impact: 'high',
      effort: 'medium',
      confidence: 95,
      reasoning: `${completedPhases.length} completed phases averaged ${avgDrift.toFixed(1)} days over plan. Without adjustment, the campaign will finish ${Math.round(avgDrift * pendingPhases.length)} days late.`,
      implementationSteps: [
        'Review remaining phase durations against minimum viable timelines',
        `Reduce buffer time in: ${remainingPhaseNames}`,
        'Identify tasks that can run in parallel across phases',
        'Communicate revised timeline to stakeholders',
      ],
      estimatedOutcome: `Recover ${Math.round(totalNegativeDrift * 0.5)}-${totalNegativeDrift} days of timeline drift`,
    })
  }

  // 2. Low performance health — pause and reassess
  if (campaign.performance_health != null && campaign.performance_health < 60 && campaign.status === 'in_progress') {
    recommendations.push({
      title: 'Pause and reassess campaign strategy',
      description: `Performance health at ${campaign.performance_health}% indicates the campaign is significantly underperforming. Immediate review needed before further budget is spent.`,
      category: 'performance',
      impact: 'high',
      effort: 'low',
      confidence: 90,
      reasoning: `Performance health below 60% threshold. Continuing execution without adjustment will likely waste remaining budget.`,
      implementationSteps: [
        'Pause active ad spend immediately',
        'Review creative performance metrics (CTR, engagement)',
        'Check audience targeting alignment with conversions',
        'Identify top-performing ad variants for reallocation',
        'Resume with adjusted strategy within 24 hours',
      ],
      estimatedOutcome: 'Prevent further budget waste and redirect to higher-performing tactics',
    })
  }

  // 3. Multiple negative drifts — add buffer days
  if (negativeDrifts.length > 2 && pendingPhases.length > 0) {
    const commonCauses = negativeDrifts
      .map(d => d.root_cause)
      .filter(Boolean)
      .slice(0, 3)
      .join('; ')

    recommendations.push({
      title: 'Add buffer days to remaining phases',
      description: `${negativeDrifts.length} negative drift events detected. Recurring delays suggest systematic underestimation. Add 20-30% buffer to remaining phases.`,
      category: 'timeline',
      impact: 'medium',
      effort: 'low',
      confidence: 88,
      reasoning: `Recurring causes: ${commonCauses || 'multiple factors'}. Pattern indicates planned durations are too aggressive for this campaign type.`,
      implementationSteps: [
        `Add ${Math.ceil(avgDrift * 0.3)} day buffer to each remaining phase`,
        'Set early warning alerts at 70% of phase duration',
        'Establish daily check-ins for phases with historical delays',
      ],
      estimatedOutcome: `Reduce future drift probability by 50-60%`,
    })
  }

  // 4. Budget utilization warning
  if (campaign.total_budget > 0 && campaign.final_cost) {
    const utilization = (campaign.final_cost / campaign.total_budget) * 100
    if (utilization > 90 && campaign.status === 'in_progress') {
      recommendations.push({
        title: 'Budget approaching limit — reallocate or extend',
        description: `${utilization.toFixed(0)}% of budget ($${campaign.final_cost.toLocaleString()} of $${campaign.total_budget.toLocaleString()}) already spent. Remaining phases may be underfunded.`,
        category: 'budget',
        impact: 'high',
        effort: 'medium',
        confidence: 92,
        reasoning: `At current burn rate, budget will be exhausted before campaign completion. Remaining phases need ${pendingPhases.length > 0 ? pendingPhases.length : 'unknown number of'} phases of execution.`,
        implementationSteps: [
          'Audit spend by phase to identify over-allocations',
          'Reduce spend on underperforming channels/creatives',
          'Request budget increase if campaign is performing well',
          'Prioritize highest-ROI activities for remaining budget',
        ],
        estimatedOutcome: 'Ensure campaign completes within budget while maximizing ROI',
      })
    }
  }

  // 5. Low operational health — escalate
  if (campaign.operational_health != null && campaign.operational_health < 50) {
    recommendations.push({
      title: 'Escalate to campaign manager for intervention',
      description: `Operational health at ${campaign.operational_health}% indicates severe execution issues. Multiple phases are delayed or blocked.`,
      category: 'risk',
      impact: 'high',
      effort: 'low',
      confidence: 95,
      reasoning: `Operational health below 50% means the campaign execution is fundamentally compromised. ${blockedPhases.length} blocked phases and ${totalNegativeDrift} total days of negative drift.`,
      implementationSteps: [
        'Schedule emergency campaign review meeting',
        'Identify and resolve all blocked phases',
        'Reassign resources from lower-priority campaigns',
        'Set up daily standups until operational health recovers above 70%',
      ],
      estimatedOutcome: 'Restore operational health to 70%+ within 3-5 business days',
    })
  }

  // 6. Blocked phases — unblock immediately
  for (const phase of blockedPhases) {
    recommendations.push({
      title: `Unblock: ${phase.phase_name}`,
      description: `Phase "${phase.phase_name}" is currently blocked. ${phase.blockers || 'No blocker details available.'} This is delaying downstream phases.`,
      category: 'risk',
      impact: 'high',
      effort: 'medium',
      confidence: 100,
      reasoning: `Blocked phases create cascading delays. Every day this phase remains blocked adds 1+ day to the overall campaign timeline.`,
      implementationSteps: [
        `Identify blocker owner for ${phase.phase_name}`,
        'Escalate to stakeholder if dependency is external',
        'Consider parallel-tracking alternative approaches',
        `Target unblock within 24 hours to prevent further drift`,
      ],
      estimatedOutcome: `Prevent ${phase.planned_duration_days}+ additional days of drift`,
    })
  }

  // 7. Risk score warnings from pre-launch assessment
  if (riskScore && riskScore.overall_score < 50 && campaign.status === 'in_progress') {
    const failingFactors = (riskScore.risk_factors || []).slice(0, 3).join(', ')
    recommendations.push({
      title: 'Address pre-launch risk factors that materialized',
      description: `Campaign launched with a risk score of ${riskScore.overall_score}/100 (${riskScore.risk_level}). ${failingFactors ? `Key risks: ${failingFactors}` : 'Multiple risk factors were flagged.'}`,
      category: 'risk',
      impact: 'medium',
      effort: 'medium',
      confidence: 85,
      reasoning: `The pre-launch risk assessment flagged this campaign as ${riskScore.risk_level} risk. ${riskScore.gate_recommendation === 'pause' ? 'System recommended pausing before launch.' : 'System recommended adjustments before launch.'}`,
      implementationSteps: riskScore.mitigation_suggestions?.map(String) || [
        'Review original risk assessment findings',
        'Implement suggested mitigations that were deferred',
        'Monitor campaign closely for predicted risk outcomes',
      ],
      estimatedOutcome: 'Reduce execution risk and improve campaign outcome probability',
    })
  }

  return recommendations
}
