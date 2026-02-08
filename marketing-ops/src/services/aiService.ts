import type { Campaign } from '@/types/campaign'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { PerformanceMetric, RiskScore } from '@/types/database'

export interface AIContext {
  campaign: Campaign
  phases: ExecutionPhase[]
  driftEvents: DriftEvent[]
  performanceMetrics: PerformanceMetric[]
  riskScore: RiskScore | null
}

interface AIMessage {
  role: 'system' | 'user'
  content: string
}

interface AIRecommendationResponse {
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

// Using Groq API (free tier, CORS-enabled for browser calls)
// Model: llama-3.3-70b-versatile (fast, good at structured output)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getApiKey(): string | null {
  return import.meta.env.VITE_GROQ_API_KEY || null
}

async function callAI(messages: AIMessage[]): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_MISSING')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

function parseRecommendations(raw: string): AIRecommendationResponse[] {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonStr = raw.trim()
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    const parsed = JSON.parse(jsonStr)
    const recs = parsed.recommendations || parsed
    if (Array.isArray(recs)) {
      return recs.map((r: Record<string, unknown>) => ({
        title: String(r.title || ''),
        description: String(r.description || ''),
        category: String(r.category || 'performance'),
        impact: (['high', 'medium', 'low'].includes(String(r.impact)) ? r.impact : 'medium') as 'high' | 'medium' | 'low',
        effort: (['low', 'medium', 'high'].includes(String(r.effort)) ? r.effort : 'medium') as 'low' | 'medium' | 'high',
        confidence: typeof r.confidence === 'number' ? Math.min(100, Math.max(0, r.confidence)) : 70,
        reasoning: String(r.reasoning || ''),
        implementationSteps: Array.isArray(r.implementationSteps) ? r.implementationSteps.map(String) : [],
        estimatedOutcome: String(r.estimatedOutcome || ''),
      }))
    }
    return []
  } catch (e) {
    console.error('Failed to parse AI response:', raw, e)
    return []
  }
}

function buildPhaseSummary(phases: ExecutionPhase[]): string {
  return phases.map(p => {
    const drift = p.drift_days != null ? ` (drift: ${p.drift_days > 0 ? '+' : ''}${p.drift_days}d)` : ''
    return `- ${p.phase_name}: ${p.status}, planned ${p.planned_duration_days}d${p.actual_duration_days != null ? `, actual ${p.actual_duration_days}d` : ''}${drift}`
  }).join('\n')
}

function buildDriftSummary(driftEvents: DriftEvent[]): string {
  if (driftEvents.length === 0) return 'No drift events recorded.'
  return driftEvents.map(d =>
    `- ${d.phase_name}: ${d.drift_days > 0 ? '+' : ''}${d.drift_days}d (${d.drift_type}) — ${d.root_cause || 'unknown cause'}`
  ).join('\n')
}

function buildPerformanceSummary(metrics: PerformanceMetric[], campaign: Campaign): string {
  if (metrics.length === 0) return 'No performance data available.'
  const latest = metrics[metrics.length - 1]
  const lines: string[] = []
  if (latest.roas != null) lines.push(`ROAS: ${latest.roas}x (target: ${campaign.target_value || 'N/A'})`)
  if (latest.ctr != null) lines.push(`CTR: ${(latest.ctr * 100).toFixed(1)}%`)
  if (latest.cpa != null) lines.push(`CPA: $${latest.cpa.toFixed(2)}`)
  if (latest.conversions != null) lines.push(`Conversions: ${latest.conversions}`)
  if (latest.spend != null) lines.push(`Spend: $${latest.spend.toLocaleString()}`)
  if (latest.revenue != null) lines.push(`Revenue: $${latest.revenue.toLocaleString()}`)
  return lines.join('\n') || 'Metrics available but no key values set.'
}

function calculateDaysRemaining(campaign: Campaign): number {
  const end = new Date(campaign.end_date)
  const now = new Date()
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export async function generateTacticalRecommendations(
  context: AIContext
): Promise<AIRecommendationResponse[]> {
  const { campaign, phases, driftEvents, performanceMetrics, riskScore } = context
  const daysRemaining = calculateDaysRemaining(campaign)

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a marketing operations analyst specializing in campaign execution optimization. Generate tactical recommendations — actionable fixes for the CURRENT campaign based on real data. Each recommendation must be specific, referencing actual numbers from the data provided.

RETURN ONLY VALID JSON in this EXACT format:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "category": "budget|creative|timeline|targeting|performance|risk",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "confidence": 85,
      "reasoning": "string",
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "estimatedOutcome": "string"
    }
  ]
}

CRITICAL: implementationSteps must be a JSON array of strings, not a string.`,
    },
    {
      role: 'user',
      content: `Analyze this campaign and generate 2-4 tactical recommendations:

Campaign: "${campaign.name}"
Type: ${campaign.campaign_type.replace(/_/g, ' ')}
Status: ${campaign.status}
Budget: $${campaign.total_budget.toLocaleString()}
Days remaining: ${daysRemaining}
Operational Health: ${campaign.operational_health ?? 'N/A'}%
Performance Health: ${campaign.performance_health ?? 'N/A'}%
Risk Score: ${riskScore?.overall_score ?? 'N/A'}/100 (${riskScore?.risk_level ?? 'unknown'})

Execution Phases:
${buildPhaseSummary(phases)}

Drift Events:
${buildDriftSummary(driftEvents)}

Performance Metrics:
${buildPerformanceSummary(performanceMetrics, campaign)}

Generate recommendations that directly address issues visible in the data above. Be specific — reference actual phase names, drift numbers, and metrics. Return ONLY valid JSON.`,
    },
  ]

  try {
    const raw = await callAI(messages)
    return parseRecommendations(raw)
  } catch (error) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_MISSING') {
      throw error
    }
    console.error('Tactical recommendations failed:', error)
    // Retry once
    try {
      const raw = await callAI(messages)
      return parseRecommendations(raw)
    } catch {
      return []
    }
  }
}

export async function generateStrategicRecommendations(
  context: AIContext
): Promise<AIRecommendationResponse[]> {
  const { campaign, phases, driftEvents, performanceMetrics } = context

  const completedPhases = phases.filter(p => p.status === 'completed')
  const positiveDrifts = driftEvents.filter(d => d.drift_type === 'positive')
  const negativeDrifts = driftEvents.filter(d => d.drift_type === 'negative')

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a marketing strategy advisor. Generate strategic recommendations — long-term improvements for FUTURE campaigns based on patterns observed in this campaign. Focus on process improvements, team workflow changes, and systemic fixes.

RETURN ONLY VALID JSON in this EXACT format:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "category": "budget|creative|timeline|targeting|performance|risk",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "confidence": 85,
      "reasoning": "string",
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "estimatedOutcome": "string"
    }
  ]
}

CRITICAL: implementationSteps must be a JSON array of strings, not a string.`,
    },
    {
      role: 'user',
      content: `Based on this campaign's execution patterns, generate 2-3 strategic recommendations for future campaigns:

Campaign: "${campaign.name}" (${campaign.campaign_type.replace(/_/g, ' ')})
Status: ${campaign.status}
Budget: $${campaign.total_budget.toLocaleString()}

Phase Execution Summary:
${buildPhaseSummary(phases)}
- Completed phases: ${completedPhases.length}/${phases.length}
- Average drift: ${completedPhases.length > 0 ? (completedPhases.reduce((s, p) => s + (p.drift_days || 0), 0) / completedPhases.length).toFixed(1) : 'N/A'}d

Positive Patterns (replicable successes):
${positiveDrifts.length > 0 ? positiveDrifts.map(d => `- ${d.phase_name}: saved ${Math.abs(d.drift_days)}d — ${d.lesson_learned || d.root_cause || 'no details'}`).join('\n') : 'None detected'}

Negative Patterns (recurring problems):
${negativeDrifts.length > 0 ? negativeDrifts.map(d => `- ${d.phase_name}: delayed ${d.drift_days}d — ${d.root_cause || 'unknown'}`).join('\n') : 'None detected'}

Performance Summary:
${buildPerformanceSummary(performanceMetrics, campaign)}

Generate recommendations that would improve future campaigns of this type. Focus on systemic process changes, not one-time fixes. Return ONLY valid JSON.`,
    },
  ]

  try {
    const raw = await callAI(messages)
    return parseRecommendations(raw)
  } catch (error) {
    if (error instanceof Error && error.message === 'GROQ_API_KEY_MISSING') {
      throw error
    }
    console.error('Strategic recommendations failed:', error)
    try {
      const raw = await callAI(messages)
      return parseRecommendations(raw)
    } catch {
      return []
    }
  }
}

export function isApiKeyConfigured(): boolean {
  return !!getApiKey()
}

/**
 * Diagnose strategic failure when campaign has clean execution but poor performance
 * Per spec: drift < 1 day BUT performance < 70% target
 */
export async function diagnoseStrategicFailure(
  context: AIContext
): Promise<{
  primary_diagnosis: string
  diagnosis_confidence: number
  creative_hypothesis_score: number
  targeting_hypothesis_score: number
  timing_hypothesis_score: number
  value_prop_hypothesis_score: number
  evidence_points: string[]
  ai_analysis: string
  recommended_actions: string[]
  prevention_strategies: string[]
  ab_test_suggestions: Array<{
    test_type: string
    hypothesis: string
    control_variant: string
    test_variant: string
    setup_instructions: string[]
    success_criteria: string
    recommended_duration_days: number
    expected_impact: string
    confidence_level: number
  }>
} | null> {
  const { campaign, phases, performanceMetrics } = context
  // driftEvents available in context for future analysis if needed

  // Calculate average drift
  const completedPhases = phases.filter(p => p.status === 'completed' && p.drift_days !== null)
  const avgDrift = completedPhases.length > 0 
    ? completedPhases.reduce((sum, p) => sum + Math.abs(p.drift_days || 0), 0) / completedPhases.length
    : 0

  const performanceHealth = campaign.performance_health || 100

  // Check if qualifies for strategic failure diagnosis
  if (avgDrift >= 1 || performanceHealth >= 70) {
    return null // Not a strategic failure
  }

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an expert marketing diagnostician. A campaign has clean execution (low drift) but poor performance (<70% target). This indicates a STRATEGIC FAILURE rather than operational issues.

Your task: Diagnose the root strategic cause and provide actionable test recommendations.

RETURN ONLY VALID JSON in this EXACT format:
{
  "primary_diagnosis": "audience_mismatch|creative_fatigue|timing_issues|value_proposition|market_saturation|competition",
  "diagnosis_confidence": 0.85,
  "creative_hypothesis_score": 30,
  "targeting_hypothesis_score": 85,
  "timing_hypothesis_score": 40,
  "value_prop_hypothesis_score": 65,
  "evidence_points": ["evidence 1", "evidence 2", "evidence 3"],
  "ai_analysis": "Detailed explanation of the diagnosis",
  "recommended_actions": ["action 1", "action 2", "action 3"],
  "prevention_strategies": ["strategy 1", "strategy 2"],
  "ab_test_suggestions": [
    {
      "test_type": "Audience Targeting Test",
      "hypothesis": "Clear hypothesis statement",
      "control_variant": "Current approach",
      "test_variant": "Proposed new approach",
      "setup_instructions": ["step 1", "step 2", "step 3"],
      "success_criteria": "Specific metric improvement target",
      "recommended_duration_days": 14,
      "expected_impact": "Expected outcome",
      "confidence_level": 0.85
    }
  ]
}

Hypothesis scores should total ~200-250 (not exactly 100). Higher score = more likely root cause.`,
    },
    {
      role: 'user',
      content: `Diagnose this strategic failure:

Campaign: "${campaign.name}"
Type: ${campaign.campaign_type.replace(/_/g, ' ')}
Objective: ${campaign.primary_objective} (KPI: ${campaign.primary_kpi}, Target: ${campaign.target_value})
Budget: $${campaign.total_budget.toLocaleString()}
Avg Drift: ${avgDrift.toFixed(2)} days (CLEAN EXECUTION)
Performance Health: ${performanceHealth}% (POOR PERFORMANCE)

Execution Summary:
${buildPhaseSummary(phases)}

Performance Metrics:
${buildPerformanceSummary(performanceMetrics, campaign)}

Target Audience:
${JSON.stringify(campaign.target_audience, null, 2)}

Creative Strategy:
${JSON.stringify(campaign.creative_strategy, null, 2)}

Competitive Context:
${JSON.stringify(campaign.competitive_context, null, 2)}

Analyze why this campaign is underperforming despite clean execution. Provide specific evidence from the data above. Generate 2-3 A/B test recommendations to validate your diagnosis. Return ONLY valid JSON.`,
    },
  ]

  try {
    const raw = await callAI(messages)
    const parsed = JSON.parse(raw)
    
    return {
      primary_diagnosis: parsed.primary_diagnosis || 'audience_mismatch',
      diagnosis_confidence: parsed.diagnosis_confidence || 0.7,
      creative_hypothesis_score: parsed.creative_hypothesis_score || 50,
      targeting_hypothesis_score: parsed.targeting_hypothesis_score || 50,
      timing_hypothesis_score: parsed.timing_hypothesis_score || 50,
      value_prop_hypothesis_score: parsed.value_prop_hypothesis_score || 50,
      evidence_points: parsed.evidence_points || [],
      ai_analysis: parsed.ai_analysis || '',
      recommended_actions: parsed.recommended_actions || [],
      prevention_strategies: parsed.prevention_strategies || [],
      ab_test_suggestions: parsed.ab_test_suggestions || [],
    }
  } catch (error) {
    console.error('Strategic failure diagnosis failed:', error)
    return null
  }
}
