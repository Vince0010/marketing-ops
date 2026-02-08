import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import type { PerformanceMetric, OverrideEvent } from '@/types/database'

// --- Detailed Risk Assessment ---

export interface RiskFactorResult {
  name: string
  score: number
  status: 'pass' | 'warn' | 'fail'
  detail: string
  weight: number
}

export interface RiskAssessment {
  overallScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactorResult[]
  gateRecommendation: 'proceed' | 'adjust' | 'pause'
  gateReason: string
  mitigationSuggestions: string[]
}

const BUDGET_BENCHMARKS: Record<string, number> = {
  new_product_launch: 10000,
  seasonal_promo: 5000,
  brand_awareness: 8000,
  lead_gen: 5000,
  retargeting: 3000,
  event_based: 7000,
}

export function calculateDetailedRiskScore(
  campaign: Campaign,
  phases: ExecutionPhase[],
  overloadedTeamCount = 0,
): RiskAssessment {
  const factors: RiskFactorResult[] = []

  // 1. Budget Adequacy (weight 25)
  const benchmark = BUDGET_BENCHMARKS[campaign.campaign_type] ?? 5000
  const budgetRatio = campaign.total_budget / benchmark
  let budgetScore: number
  let budgetStatus: 'pass' | 'warn' | 'fail'
  if (budgetRatio >= 1.5) { budgetScore = 90; budgetStatus = 'pass' }
  else if (budgetRatio >= 0.8) { budgetScore = 70; budgetStatus = 'pass' }
  else if (budgetRatio >= 0.5) { budgetScore = 50; budgetStatus = 'warn' }
  else { budgetScore = 30; budgetStatus = 'fail' }
  factors.push({
    name: 'Budget Adequacy',
    score: budgetScore,
    status: budgetStatus,
    detail: `Budget $${campaign.total_budget.toLocaleString()} is ${Math.round(budgetRatio * 100)}% of typical $${benchmark.toLocaleString()} for ${campaign.campaign_type.replace(/_/g, ' ')}`,
    weight: 25,
  })

  // 2. Timeline Feasibility (weight 25)
  const campaignDays = Math.ceil(
    (new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )
  const sumPhaseDays = phases.reduce((s, p) => s + p.planned_duration_days, 0)
  let timeScore: number
  let timeStatus: 'pass' | 'warn' | 'fail'
  if (phases.length === 0) {
    timeScore = 60; timeStatus = 'warn'
  } else if (campaignDays >= sumPhaseDays * 1.2) {
    timeScore = 90; timeStatus = 'pass'
  } else if (campaignDays >= sumPhaseDays) {
    timeScore = 70; timeStatus = 'pass'
  } else if (campaignDays >= sumPhaseDays * 0.8) {
    timeScore = 50; timeStatus = 'warn'
  } else {
    timeScore = 30; timeStatus = 'fail'
  }
  factors.push({
    name: 'Timeline Feasibility',
    score: timeScore,
    status: timeStatus,
    detail: phases.length === 0
      ? 'No execution phases defined yet'
      : `${campaignDays} campaign days for ${sumPhaseDays} days of planned work across ${phases.length} phases`,
    weight: 25,
  })

  // 3. Team Capacity (weight 20)
  let teamScore: number
  let teamStatus: 'pass' | 'warn' | 'fail'
  if (overloadedTeamCount === 0) { teamScore = 90; teamStatus = 'pass' }
  else if (overloadedTeamCount === 1) { teamScore = 65; teamStatus = 'warn' }
  else { teamScore = 40; teamStatus = 'fail' }
  factors.push({
    name: 'Team Capacity',
    score: teamScore,
    status: teamStatus,
    detail: overloadedTeamCount === 0
      ? 'All assigned team members have available capacity'
      : `${overloadedTeamCount} team member${overloadedTeamCount > 1 ? 's' : ''} at or over capacity`,
    weight: 20,
  })

  // 4. Historical Performance (weight 15)
  const constraints = campaign.constraints as Record<string, unknown> | undefined
  let histCount = 0
  if (constraints?.historical_ctr) histCount++
  if (constraints?.historical_cpa) histCount++
  if (constraints?.historical_roas) histCount++
  let histScore: number
  let histStatus: 'pass' | 'warn' | 'fail'
  if (histCount >= 3) { histScore = 85; histStatus = 'pass' }
  else if (histCount >= 1) { histScore = 65; histStatus = 'warn' }
  else { histScore = 45; histStatus = 'warn' }
  factors.push({
    name: 'Historical Performance',
    score: histScore,
    status: histStatus,
    detail: histCount >= 3
      ? 'Historical benchmarks available for validation'
      : histCount >= 1
        ? `Only ${histCount} of 3 historical benchmarks provided`
        : 'No historical data to validate performance assumptions',
    weight: 15,
  })

  // 5. Creative Readiness (weight 15)
  const creative = campaign.creative_strategy as Record<string, unknown> | undefined
  let creativeCount = 0
  if (creative?.format) creativeCount++
  if (creative?.theme) creativeCount++
  if (creative?.message) creativeCount++
  if (creative?.cta) creativeCount++
  if (creative?.testing_plan) creativeCount++
  let creativeScore: number
  let creativeStatus: 'pass' | 'warn' | 'fail'
  if (creativeCount >= 4) { creativeScore = 90; creativeStatus = 'pass' }
  else if (creativeCount >= 2) { creativeScore = 60; creativeStatus = 'warn' }
  else { creativeScore = 35; creativeStatus = 'fail' }
  factors.push({
    name: 'Creative Readiness',
    score: creativeScore,
    status: creativeStatus,
    detail: creativeCount >= 4
      ? 'Creative strategy is well-defined with format, theme, messaging, and CTA'
      : `Only ${creativeCount} of 5 creative strategy fields completed`,
    weight: 15,
  })

  // Overall score
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0)
  const overallScore = Math.round(
    factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
  )

  const riskLevel: RiskAssessment['riskLevel'] =
    overallScore >= 70 ? 'low' : overallScore >= 50 ? 'medium' : overallScore >= 30 ? 'high' : 'critical'

  const gateRecommendation = getGateDecision(overallScore)

  const gateReason =
    gateRecommendation === 'proceed' ? 'Low risk profile — campaign is ready to launch'
    : gateRecommendation === 'adjust' ? 'Moderate risk — review flagged factors before launch'
    : 'High risk — significant issues must be addressed before proceeding'

  const mitigationSuggestions = factors
    .filter(f => f.status !== 'pass')
    .map(f => {
      if (f.name === 'Budget Adequacy') return 'Consider increasing budget or reducing campaign scope'
      if (f.name === 'Timeline Feasibility') return 'Add buffer days or reduce phase durations'
      if (f.name === 'Team Capacity') return 'Redistribute workload or bring in additional resources'
      if (f.name === 'Historical Performance') return 'Provide historical benchmarks (CTR, CPA, ROAS) for better risk assessment'
      if (f.name === 'Creative Readiness') return 'Complete creative strategy (format, theme, message, CTA, testing plan)'
      return 'Review and address this risk factor'
    })

  return { overallScore, riskLevel, factors, gateRecommendation, gateReason, mitigationSuggestions }
}

// --- Legacy simple risk score (backward compat) ---

export function calculateRiskScore(campaign: Record<string, unknown>): number {
  let score = 100

  // Budget risk - safely check with type guard
  const totalBudget = campaign.total_budget as number | undefined
  if (totalBudget && totalBudget < 1000) score -= 20

  // Timeline risk - safely check with type guard
  const startDate = campaign.start_date as string | undefined
  const endDate = campaign.end_date as string | undefined
  if (startDate && endDate) {
    const duration = new Date(endDate).getTime() - new Date(startDate).getTime()
    const durationDays = duration / (1000 * 60 * 60 * 24)
    if (durationDays < 14) score -= 15
  }

  // First campaign risk - safely check with type guard
  const historicalContext = campaign.historical_context as { similar_campaigns?: unknown[] } | undefined
  if (!historicalContext?.similar_campaigns?.length) score -= 10

  return Math.max(0, Math.min(100, score))
}

export function calculateDriftDays(plannedDays: number, actualDays: number): number {
  return actualDays - plannedDays
}

export function getDriftType(driftDays: number): 'positive' | 'negative' | 'neutral' {
  if (driftDays < -1) return 'positive'
  if (driftDays > 1) return 'negative'
  return 'neutral'
}

export function getGateDecision(riskScore: number): 'proceed' | 'adjust' | 'pause' {
  if (riskScore >= 70) return 'proceed'
  if (riskScore >= 50) return 'adjust'
  return 'pause'
}

// ============================================================================
// Phase Metrics Calculations (for Kanban board)
// ============================================================================

import type { MarketerAction, TaskPhaseHistory } from '@/types/actions'

/**
 * Aggregate metrics for a single phase
 */
export interface PhaseAggregateMetrics {
  phaseId: string
  phaseName: string
  plannedDurationDays: number
  totalTasksCompleted: number
  totalTasksActive: number
  avgTimeInPhaseMinutes: number
  minTimeInPhaseMinutes: number
  maxTimeInPhaseMinutes: number
  tasksCompletedPerDay: number
  currentWIP: number
  isBottleneck: boolean
  bottleneckReason?: string
}

/**
 * Overall operations health metrics
 */
export interface OperationsHealth {
  score: number
  status: 'healthy' | 'warning' | 'critical'
  metrics: {
    totalTasksCompleted: number
    totalTasksActive: number
    avgCycleTimeMinutes: number
    throughputPerDay: number
    bottleneckCount: number
  }
  recommendations: string[]
}

/**
 * Calculate aggregate metrics for a phase
 */
export function calculatePhaseAggregateMetrics(
  phaseId: string,
  phaseName: string,
  plannedDurationDays: number,
  completedHistory: TaskPhaseHistory[],
  activeTasks: MarketerAction[]
): PhaseAggregateMetrics {
  const timeSpentValues = completedHistory
    .filter(h => h.time_spent_minutes !== null)
    .map(h => h.time_spent_minutes!)

  const avgTime = timeSpentValues.length > 0
    ? timeSpentValues.reduce((a, b) => a + b, 0) / timeSpentValues.length
    : 0

  const minTime = timeSpentValues.length > 0 ? Math.min(...timeSpentValues) : 0
  const maxTime = timeSpentValues.length > 0 ? Math.max(...timeSpentValues) : 0

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const recentCompletions = completedHistory.filter(h =>
    h.exited_at && new Date(h.exited_at) >= dayAgo
  )

  const isBottleneck = activeTasks.length > 5 || avgTime > plannedDurationDays * 24 * 60

  return {
    phaseId,
    phaseName,
    plannedDurationDays,
    totalTasksCompleted: completedHistory.length,
    totalTasksActive: activeTasks.length,
    avgTimeInPhaseMinutes: avgTime,
    minTimeInPhaseMinutes: minTime,
    maxTimeInPhaseMinutes: maxTime,
    tasksCompletedPerDay: recentCompletions.length,
    currentWIP: activeTasks.length,
    isBottleneck,
    bottleneckReason: isBottleneck
      ? activeTasks.length > 5
        ? `High WIP: ${activeTasks.length} tasks`
        : `Slow processing`
      : undefined
  }
}

/**
 * Calculate overall operations health from phase metrics
 */
export function calculateOperationsHealthFromTaskFlow(
  phaseMetrics: PhaseAggregateMetrics[],
  totalTasks: number
): OperationsHealth {
  const totalCompleted = phaseMetrics.reduce((sum, m) => sum + m.totalTasksCompleted, 0)
  const totalActive = phaseMetrics.reduce((sum, m) => sum + m.totalTasksActive, 0)
  const bottleneckCount = phaseMetrics.filter(m => m.isBottleneck).length

  const avgTimes = phaseMetrics.filter(m => m.avgTimeInPhaseMinutes > 0).map(m => m.avgTimeInPhaseMinutes)
  const avgCycleTime = avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0
  const totalThroughput = phaseMetrics.reduce((sum, m) => sum + m.tasksCompletedPerDay, 0)

  let score = 100 - (bottleneckCount * 15)
  if (totalActive > totalTasks * 0.5) score -= 20
  if (totalThroughput < 1) score -= 10
  score = Math.max(0, Math.min(100, score))

  const status: OperationsHealth['status'] = score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical'

  const recommendations: string[] = []
  if (bottleneckCount > 0) recommendations.push(`Address ${bottleneckCount} bottleneck phase(s)`)
  if (totalActive > totalTasks * 0.5) recommendations.push('Reduce work in progress')

  return {
    score,
    status,
    metrics: { totalTasksCompleted: totalCompleted, totalTasksActive: totalActive, avgCycleTimeMinutes: avgCycleTime, throughputPerDay: totalThroughput, bottleneckCount },
    recommendations
  }
}

// --- Campaign Completion & Performance Evaluation ---

export interface CampaignOutcome {
  success: 'success' | 'failure' | 'partial_success'
  finalMetricValue: number
  targetValue: number
  achievementRate: number
  explanation: string
}

/**
 * Calculates final campaign performance by aggregating performance_metrics
 * and determining success based on primary KPI achievement
 */
export function calculateFinalPerformance(
  campaign: Campaign,
  performanceMetrics: PerformanceMetric[]
): CampaignOutcome {
  if (performanceMetrics.length === 0) {
    return {
      success: 'failure',
      finalMetricValue: 0,
      targetValue: campaign.target_value,
      achievementRate: 0,
      explanation: 'No performance data available to evaluate campaign outcome'
    }
  }

  // Get the latest or aggregate metric based on primary KPI
  const kpi = campaign.primary_kpi
  const targetValue = campaign.target_value
  let finalMetricValue: number

  // For most metrics, use the latest value
  // For cumulative metrics (ROAS, conversions), could average or sum
  const latestMetric = performanceMetrics[performanceMetrics.length - 1]

  switch (kpi) {
    case 'ROAS':
      // Average ROAS across all metrics (or use latest)
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) / performanceMetrics.length
      break
    case 'CPA':
      // Average CPA (lower is better)
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.cpa || 0), 0) / performanceMetrics.length
      break
    case 'CPL':
      // Average CPL (lower is better) - use CPA as proxy
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.cpa || 0), 0) / performanceMetrics.length
      break
    case 'CTR':
      // Average CTR
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / performanceMetrics.length
      break
    case 'engagement_rate':
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / performanceMetrics.length
      break
    case 'reach':
      // Use latest reach (or max)
      finalMetricValue = latestMetric.reach || 0
      break
    case 'video_views':
      // Sum total video views
      finalMetricValue = performanceMetrics.reduce((sum, m) => sum + (m.video_views || 0), 0)
      break
    default:
      // Default to latest ROAS
      finalMetricValue = latestMetric.roas || 0
  }

  // Calculate achievement rate (handle inverse metrics like CPA/CPL)
  let achievementRate: number
  if (kpi === 'CPA' || kpi === 'CPL') {
    // For cost metrics, lower is better: achievement = (target / actual) * 100
    achievementRate = targetValue > 0 ? (targetValue / finalMetricValue) * 100 : 0
  } else {
    // For performance metrics, higher is better: achievement = (actual / target) * 100
    achievementRate = targetValue > 0 ? (finalMetricValue / targetValue) * 100 : 0
  }

  // Determine success level with 80% threshold for partial success
  let success: 'success' | 'failure' | 'partial_success'
  let explanation: string

  if (achievementRate >= 100) {
    success = 'success'
    explanation = `Campaign exceeded target ${kpi} of ${targetValue} with actual ${finalMetricValue.toFixed(2)} (${achievementRate.toFixed(1)}% achievement)`
  } else if (achievementRate >= 80) {
    success = 'partial_success'
    explanation = `Campaign achieved ${achievementRate.toFixed(1)}% of target ${kpi}, reaching ${finalMetricValue.toFixed(2)} vs target ${targetValue}`
  } else {
    success = 'failure'
    explanation = `Campaign underperformed target ${kpi} of ${targetValue}, achieving only ${finalMetricValue.toFixed(2)} (${achievementRate.toFixed(1)}%)`
  }

  return {
    success,
    finalMetricValue,
    targetValue,
    achievementRate,
    explanation
  }
}

// --- Override Learning System ---

export interface OverrideOutcome {
  outcome: 'success' | 'failure' | 'partial_success'
  outcome_explanation: string
  lesson_learned: string
  system_was_correct: boolean
}

/**
 * Evaluates whether an override decision was justified based on campaign outcome
 */
export function evaluateOverrideOutcome(
  campaign: Campaign,
  overrideEvent: OverrideEvent,
  campaignOutcome: CampaignOutcome
): OverrideOutcome {
  const { original_recommendation, user_action, risk_score_at_time } = overrideEvent
  const { success, achievementRate, explanation } = campaignOutcome

  let outcome_explanation: string
  let lesson_learned: string
  let system_was_correct: boolean

  // Determine if the override was justified
  if (original_recommendation === 'pause' && user_action === 'proceed') {
    // User proceeded despite system recommending pause
    if (success === 'success') {
      system_was_correct = false
      outcome_explanation = `User correctly overrode the pause recommendation. ${explanation}`
      lesson_learned = `High risk score (${risk_score_at_time || 'N/A'}) did not prevent success. User's contextual judgment about ${overrideEvent.reason} was valid. Consider adjusting risk thresholds or adding context factors.`
    } else if (success === 'partial_success') {
      system_was_correct = false // User was partially right
      outcome_explanation = `Override led to acceptable results despite risks. ${explanation}`
      lesson_learned = `Risk indicators were valid but not critical. Campaign achieved ${achievementRate.toFixed(1)}% of target despite concerns about ${overrideEvent.reason}. Some risk tolerance is acceptable.`
    } else {
      system_was_correct = true
      outcome_explanation = `System recommendation to pause was correct. ${explanation}`
      lesson_learned = `Risk assessment accurately predicted failure. Risk score of ${risk_score_at_time || 'N/A'} was justified. User's reasoning (${overrideEvent.reason}) did not offset structural risks.`
    }
  } else if (original_recommendation === 'adjust' && user_action === 'proceed') {
    // User proceeded without adjustments
    if (success === 'success') {
      system_was_correct = false
      outcome_explanation = `Campaign succeeded without required adjustments. ${explanation}`
      lesson_learned = `Adjustment recommendation was overly cautious. User's confidence in ${overrideEvent.reason} was well-founded. System may have overweighted certain risk factors.`
    } else {
      system_was_correct = true
      outcome_explanation = `Campaign would have benefited from recommended adjustments. ${explanation}`
      lesson_learned = `Ignoring adjustment recommendation led to underperformance. User's reasoning (${overrideEvent.reason}) did not compensate for identified gaps. Enforce adjustment gates more strictly.`
    }
  } else if (original_recommendation === 'proceed' && (user_action === 'pause' || user_action === 'adjust')) {
    // User was more conservative than system
    system_was_correct = false // User chose caution (unclear if necessary)
    outcome_explanation = `User chose to ${user_action} despite system clearance. Outcome: ${success}`
    lesson_learned = `User exercised additional caution beyond system recommendation. Reasoning: ${overrideEvent.reason}. This may indicate missing risk factors in assessment.`
  } else {
    // User agreed with system (not really an override scenario)
    system_was_correct = true
    outcome_explanation = `User agreed with system recommendation. Campaign outcome: ${success}`
    lesson_learned = `No override conflict. System and user aligned.`
  }

  return {
    outcome: success,
    outcome_explanation,
    lesson_learned,
    system_was_correct
  }
}
