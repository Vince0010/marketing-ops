/**
 * Strategic Failure Detection and Diagnosis Service
 * 
 * Implements the strategic failure analysis logic:
 * - Detects when drift < 1 day BUT performance < 70% target
 * - This indicates strategic issues (creative, targeting, etc.) vs operational issues
 * - Provides AI-powered diagnosis with ranked hypotheses
 */

import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase } from '@/types/phase'
import type { StrategicFailure, ABTestSuggestion } from '@/types/database'

interface DetectionResult {
  shouldTrigger: boolean
  avgDrift: number
  performanceHealth: number
  detectionCriteria: string
}

/**
 * Determines if a campaign qualifies for strategic failure diagnosis
 * Per design: drift < 1 day BUT performance < 70% target
 */
export function detectStrategicFailure(
  campaign: Campaign,
  phases: ExecutionPhase[]
): DetectionResult {
  // Calculate average drift from completed phases
  const completedPhases = phases.filter(p => p.status === 'completed' && p.drift_days !== null)
  const avgDrift = completedPhases.length > 0
    ? completedPhases.reduce((sum, p) => sum + Math.abs(p.drift_days || 0), 0) / completedPhases.length
    : 0

  const performanceHealth = campaign.performance_health || 100

  // Strategic failure criteria: clean execution but poor performance
  const shouldTrigger = avgDrift < 1 && performanceHealth < 70

  const detectionCriteria = shouldTrigger
    ? `Low execution drift (${avgDrift.toFixed(1)} days avg) with poor performance (${performanceHealth}% health). Indicates strategic rather than operational failure.`
    : ''

  return {
    shouldTrigger,
    avgDrift,
    performanceHealth,
    detectionCriteria
  }
}

/**
 * Analyzes a campaign to generate strategic failure diagnosis
 * Uses heuristics and pattern matching to identify root causes
 */
export function analyzeStrategicFailure(
  campaign: Campaign,
  phases: ExecutionPhase[],
  detectionResult: DetectionResult
): Omit<StrategicFailure, 'id' | 'created_at'> {
  // Calculate hypothesis scores based on campaign data
  const hypotheses = calculateHypotheses(campaign, phases)

  // Determine primary diagnosis (highest scoring hypothesis)
  const primaryDiagnosis = getPrimaryDiagnosis(hypotheses)

  // Generate evidence points
  const evidencePoints = generateEvidence(campaign, phases, hypotheses)

  // Generate recommendations
  const recommendedActions = generateRecommendations(primaryDiagnosis, campaign)

  // Generate A/B test suggestions
  const abTestSuggestions = generateABTests(primaryDiagnosis, campaign)

  // Generate prevention strategies
  const preventionStrategies = generatePreventionStrategies(primaryDiagnosis)

  return {
    campaign_id: campaign.id,
    detected_date: new Date().toISOString().split('T')[0],
    detection_criteria: detectionResult.detectionCriteria,
    primary_diagnosis: primaryDiagnosis.type,
    diagnosis_confidence: primaryDiagnosis.confidence,
    creative_hypothesis_score: hypotheses.creative,
    targeting_hypothesis_score: hypotheses.targeting,
    timing_hypothesis_score: hypotheses.timing,
    value_prop_hypothesis_score: hypotheses.valueProp,
    evidence_points: evidencePoints,
    performance_data: {
      performance_health: campaign.performance_health,
      target_value: campaign.target_value,
      primary_kpi: campaign.primary_kpi,
      avg_drift: detectionResult.avgDrift
    },
    ai_analysis: generateAIAnalysis(primaryDiagnosis, detectionResult),
    ai_model_used: 'rule-based-analysis-v1',
    ai_generated_at: new Date().toISOString(),
    recommended_actions: recommendedActions,
    ab_test_suggestions: abTestSuggestions,
    resolution_actions: undefined,
    resolved: false,
    resolution_date: undefined,
    post_resolution_performance: undefined,
    lesson_learned: undefined,
    prevention_strategies: preventionStrategies,
    analyzed_by: 'system'
  }
}

/**
 * Calculate hypothesis scores (0-100) for each potential failure type
 */
function calculateHypotheses(campaign: Campaign, phases: ExecutionPhase[]): {
  creative: number
  targeting: number
  timing: number
  valueProp: number
} {
  let creative = 40 // Base score
  let targeting = 40
  let timing = 40
  let valueProp = 40

  const performanceGap = 100 - (campaign.performance_health || 100)

  // Creative hypothesis scoring
  const creativePhase = phases.find(p => p.phase_name?.toLowerCase().includes('creative'))
  if (creativePhase?.drift_days && creativePhase.drift_days > 0) {
    creative -= 15 // Rushed creative likely lower quality
  } else {
    creative += 20 // Normal creative timeline suggests other issues
  }

  // Check if campaign is awareness-focused (creative is critical)
  if (campaign.primary_objective === 'brand_awareness' || campaign.primary_kpi === 'engagement_rate') {
    creative += 15
  }

  // Targeting hypothesis scoring
  if (campaign.target_audience && Object.keys(campaign.target_audience).length === 0) {
    targeting += 25 // No targeting defined = likely mismatch
  }

  if (campaign.audience_type?.includes('cold')) {
    targeting += 15 // Cold audiences harder to reach
  }

  // Timing hypothesis scoring
  const launchPhase = phases.find(p => p.phase_name?.toLowerCase().includes('launch'))
  if (launchPhase?.drift_days && Math.abs(launchPhase.drift_days) > 2) {
    timing += 20 // Launch timing issues
  }

  // Check if seasonal campaign
  const startDate = new Date(campaign.start_date)
  const month = startDate.getMonth()
  // Q4 (Oct-Dec) = holiday season, higher timing sensitivity
  if (month >= 9 && month <= 11) {
    timing += 10
  }

  // Value prop hypothesis scoring
  if (campaign.primary_objective === 'lead_gen') {
    valueProp += 15 // Direct response campaigns more value-prop sensitive
  }

  // If cost-based KPI and performance is poor, likely value prop issue
  if (performanceGap > 30) {
    valueProp += 20
  }

  // Normalize scores to 0-100
  const normalize = (score: number) => Math.max(0, Math.min(100, score))

  return {
    creative: normalize(creative),
    targeting: normalize(targeting),
    timing: normalize(timing),
    valueProp: normalize(valueProp)
  }
}

/**
 * Determine primary diagnosis from hypothesis scores
 */
function getPrimaryDiagnosis(hypotheses: { creative: number; targeting: number; timing: number; valueProp: number }): {
  type: StrategicFailure['primary_diagnosis']
  confidence: number
} {
  const entries = [
    { type: 'creative_fatigue' as const, score: hypotheses.creative },
    { type: 'audience_mismatch' as const, score: hypotheses.targeting },
    { type: 'timing_issues' as const, score: hypotheses.timing },
    { type: 'value_proposition' as const, score: hypotheses.valueProp }
  ]

  const sorted = entries.sort((a, b) => b.score - a.score)
  const top = sorted[0]

  // Confidence based on separation from second place
  const secondScore = sorted[1].score
  const separation = top.score - secondScore
  const confidence = Math.min(0.95, 0.5 + (separation / 100))

  return {
    type: top.type,
    confidence
  }
}

/**
 * Generate evidence points supporting the diagnosis
 */
function generateEvidence(
  campaign: Campaign,
  phases: ExecutionPhase[],
  hypotheses: { creative: number; targeting: number; timing: number; valueProp: number }
): string[] {
  const evidence: string[] = []

  const performanceHealth = campaign.performance_health || 100
  const performanceGap = 100 - performanceHealth

  // Always include performance data
  evidence.push(`Campaign performance at ${performanceHealth}% of target (${performanceGap}% below expected)`)

  // Execution quality evidence
  const completedPhases = phases.filter(p => p.status === 'completed')
  const avgDrift = completedPhases.length > 0
    ? completedPhases.reduce((sum, p) => sum + Math.abs(p.drift_days || 0), 0) / completedPhases.length
    : 0

  evidence.push(`Low execution drift (${avgDrift.toFixed(1)} days avg) rules out operational delays as primary cause`)

  // Hypothesis-specific evidence
  if (hypotheses.creative > 60) {
    if (campaign.primary_objective === 'brand_awareness') {
      evidence.push('Awareness campaigns heavily dependent on creative quality and messaging resonance')
    }
    evidence.push('Creative assets may not be resonating with target audience')
  }

  if (hypotheses.targeting > 60) {
    if (campaign.audience_type?.includes('cold')) {
      evidence.push('Cold audience targeting increases risk of audience mismatch')
    }
    if (!campaign.target_audience || Object.keys(campaign.target_audience).length === 0) {
      evidence.push('Limited audience targeting parameters defined')
    }
  }

  if (hypotheses.timing > 60) {
    const launchPhase = phases.find(p => p.phase_name?.toLowerCase().includes('launch'))
    if (launchPhase?.drift_days) {
      evidence.push(`Launch timing shifted by ${Math.abs(launchPhase.drift_days)} days from original plan`)
    }
  }

  if (hypotheses.valueProp > 60) {
    evidence.push('High acquisition costs suggest value proposition may not justify price point')
  }

  return evidence
}

/**
 * Generate actionable recommendations based on diagnosis
 */
function generateRecommendations(
  diagnosis: { type: StrategicFailure['primary_diagnosis']; confidence: number },
  campaign: Campaign
): string[] {
  const actions: string[] = []

  switch (diagnosis.type) {
    case 'creative_fatigue':
      actions.push('Refresh creative assets with new messaging angles')
      actions.push('Test different visual styles and formats (video vs static)')
      actions.push('Analyze top-performing competitor creatives for inspiration')
      if (campaign.creative_strategy) {
        actions.push('Review creative brief alignment with actual deliverables')
      }
      break

    case 'audience_mismatch':
      actions.push('Narrow targeting to most qualified audience segments')
      actions.push('Analyze current audience demographics in Meta Ads Manager')
      actions.push('Create lookalike audiences from best-performing segments')
      actions.push('Test different audience interest combinations')
      break

    case 'timing_issues':
      actions.push('Review market timing - consider pausing until optimal window')
      actions.push('Analyze competitor activity during campaign period')
      actions.push('Check for seasonal trends affecting performance')
      actions.push('Evaluate day-of-week and time-of-day performance patterns')
      break

    case 'value_proposition':
      actions.push('Strengthen value proposition messaging in ad copy')
      actions.push('Test different price points or promotional offers')
      actions.push('Highlight unique differentiators more prominently')
      actions.push('Add social proof elements (testimonials, reviews, case studies)')
      break

    default:
      actions.push('Conduct comprehensive campaign audit')
      actions.push('Review all campaign elements against industry best practices')
  }

  // Always add measurement recommendation
  actions.push('Set up detailed tracking to measure impact of changes')

  return actions
}

/**
 * Generate A/B test suggestions for the diagnosis
 */
function generateABTests(
  diagnosis: { type: StrategicFailure['primary_diagnosis']; confidence: number },
  campaign: Campaign
): ABTestSuggestion[] {
  const tests: ABTestSuggestion[] = []

  switch (diagnosis.type) {
    case 'creative_fatigue':
      tests.push({
        test_type: 'Creative Format Test',
        hypothesis: 'Different creative format will improve engagement and conversion rates',
        control_variant: 'Current static image ads',
        test_variant: 'Video ads (15-30 seconds) showcasing product in use',
        setup_instructions: [
          'Create 3 video variations with different hooks (first 3 seconds)',
          'Allocate 50/50 budget split between static and video',
          'Run test for minimum 7 days to gather statistical significance',
          'Ensure both variants target same audience segments'
        ],
        success_criteria: `Video variant achieves ${campaign.primary_kpi} improvement of 15%+ vs control`,
        expected_impact: '15-30% improvement in engagement',
        confidence_level: 0.75,
        recommended_duration_days: 7
      })

      tests.push({
        test_type: 'Messaging Angle Test',
        hypothesis: 'Different messaging angle addresses deeper customer pain points',
        control_variant: 'Current value proposition focus',
        test_variant: 'Problem-solution storytelling approach',
        setup_instructions: [
          'Develop copy highlighting customer pain point first',
          'Position product as solution in secondary messaging',
          'Keep visual creative consistent, only change copy',
          'Split traffic 50/50 between messaging angles'
        ],
        success_criteria: 'New messaging achieves 20%+ higher click-through rate',
        expected_impact: '10-25% CTR improvement',
        confidence_level: 0.7,
        recommended_duration_days: 7
      })
      break

    case 'audience_mismatch':
      tests.push({
        test_type: 'Audience Segmentation Test',
        hypothesis: 'Narrower, more qualified audience segment will improve conversion efficiency',
        control_variant: 'Current broad audience targeting',
        test_variant: 'Narrowed audience with layered interests + behaviors',
        setup_instructions: [
          'Create refined audience combining top-performing demographics',
          'Layer interest targeting with behavioral signals',
          'Allocate 60% budget to test, 40% to control',
          'Monitor cost per result and ROAS daily'
        ],
        success_criteria: `Test audience achieves ${campaign.primary_kpi} improvement of 25%+`,
        expected_impact: '20-40% CPA improvement',
        confidence_level: 0.8,
        recommended_duration_days: 10
      })

      tests.push({
        test_type: 'Lookalike Audience Test',
        hypothesis: 'Lookalike audience from converters will outperform interest-based targeting',
        control_variant: 'Current interest-based targeting',
        test_variant: '1% lookalike audience from past converters',
        setup_instructions: [
          'Create custom audience from website purchasers (last 180 days)',
          'Build 1% lookalike in target geographic region',
          'Set up separate ad set with same creative',
          'Compare performance after 500+ impressions each'
        ],
        success_criteria: 'Lookalike achieves 30%+ better conversion rate',
        expected_impact: '25-50% conversion rate improvement',
        confidence_level: 0.85,
        recommended_duration_days: 14
      })
      break

    case 'timing_issues':
      tests.push({
        test_type: 'Dayparting Test',
        hypothesis: 'Specific time windows will show significantly better performance',
        control_variant: 'All-day delivery (current)',
        test_variant: 'Concentrated delivery during peak hours (9am-12pm, 6pm-9pm)',
        setup_instructions: [
          'Duplicate campaign with ad scheduling restrictions',
          'Analyze current performance by hour of day',
          'Focus 70% of budget on top-performing 6-hour windows',
          'Run for full week to account for day-of-week variance'
        ],
        success_criteria: 'Dayparted campaign achieves 20%+ higher ROAS',
        expected_impact: '15-30% efficiency improvement',
        confidence_level: 0.65,
        recommended_duration_days: 7
      })
      break

    case 'value_proposition':
      tests.push({
        test_type: 'Offer Variation Test',
        hypothesis: 'Stronger offer with urgency will improve conversion rates',
        control_variant: 'Current standard offer',
        test_variant: 'Limited-time discount with countdown timer',
        setup_instructions: [
          'Create variation with "24-hour flash sale" messaging',
          'Add countdown timer creative element',
          'Set up conversion tracking for both variants',
          'Ensure backend can support promotional pricing'
        ],
        success_criteria: 'Urgency variant achieves 30%+ conversion lift',
        expected_impact: '25-45% conversion rate increase',
        confidence_level: 0.8,
        recommended_duration_days: 5
      })

      tests.push({
        test_type: 'Social Proof Test',
        hypothesis: 'Adding customer testimonials will build trust and improve conversions',
        control_variant: 'Current ads without social proof',
        test_variant: 'Ads featuring customer testimonials and ratings',
        setup_instructions: [
          'Select 3-5 strong customer testimonials',
          'Create ad variations with quote overlays or review screenshots',
          'Include star ratings prominently',
          'Test across all placements'
        ],
        success_criteria: 'Social proof ads achieve 15%+ higher conversion rate',
        expected_impact: '10-20% trust and conversion uplift',
        confidence_level: 0.75,
        recommended_duration_days: 7
      })
      break
  }

  return tests
}

/**
 * Generate prevention strategies for future campaigns
 */
function generatePreventionStrategies(
  diagnosis: { type: StrategicFailure['primary_diagnosis']; confidence: number }
): string[] {
  const strategies: string[] = []

  strategies.push('Conduct pre-launch strategic review with cross-functional team')
  strategies.push('Set up A/B testing framework from day one for faster iteration')

  switch (diagnosis.type) {
    case 'creative_fatigue':
      strategies.push('Develop creative refresh schedule (every 2-3 weeks)')
      strategies.push('Build creative library with multiple tested formats')
      strategies.push('Conduct creative testing before full campaign launch')
      break

    case 'audience_mismatch':
      strategies.push('Validate audience targeting with small test budget before scaling')
      strategies.push('Build detailed customer personas based on past converters')
      strategies.push('Use lookalike audiences from proven customer data')
      break

    case 'timing_issues':
      strategies.push('Research seasonal trends and competitor calendars in planning phase')
      strategies.push('Build in buffer time for external market factors')
      strategies.push('Plan campaigns around known peak performance windows')
      break

    case 'value_proposition':
      strategies.push('Test messaging and offers before committing full budget')
      strategies.push('Conduct customer research to validate value proposition resonance')
      strategies.push('Benchmark pricing against competitors before launch')
      break
  }

  return strategies
}

/**
 * Generate AI analysis explanation
 */
function generateAIAnalysis(
  diagnosis: { type: StrategicFailure['primary_diagnosis']; confidence: number },
  detectionResult: DetectionResult
): string {
  const diagnosisName = diagnosis.type.split('_').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ')

  let analysis = `Analysis indicates ${diagnosisName} as the primary root cause with ${Math.round(diagnosis.confidence * 100)}% confidence. `

  analysis += `The campaign executed cleanly with only ${detectionResult.avgDrift.toFixed(1)} days average drift, ruling out operational execution as the primary failure driver. `

  analysis += `However, performance health is at ${detectionResult.performanceHealth}%, which is ${100 - detectionResult.performanceHealth}% below target. `

  analysis += `This pattern—low execution drift but poor performance—is characteristic of strategic issues rather than operational problems.`

  return analysis
}

/**
 * Create a strategic failure record in the database
 */
export async function createStrategicFailure(
  campaign: Campaign,
  phases: ExecutionPhase[]
): Promise<{ data: StrategicFailure | null; error: Error | null }> {
  try {
    // Check if failure already exists
    const { data: existing } = await supabase
      .from('strategic_failures')
      .select('id')
      .eq('campaign_id', campaign.id)
      .maybeSingle()

    if (existing) {
      return { data: null, error: new Error('Strategic failure already exists for this campaign') }
    }

    // Detect if qualifies for diagnosis
    const detection = detectStrategicFailure(campaign, phases)
    if (!detection.shouldTrigger) {
      return { data: null, error: new Error('Campaign does not meet criteria for strategic failure diagnosis') }
    }

    // Analyze and create diagnosis
    const diagnosis = analyzeStrategicFailure(campaign, phases, detection)

    const { data, error } = await supabase
      .from('strategic_failures')
      .insert(diagnosis)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: data as StrategicFailure, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
