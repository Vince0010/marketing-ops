/**
 * Correlation Service
 * 
 * Analyzes correlations between task events (delays, completions) and 
 * performance metrics (sales, engagement, views, Meta Ads) using AI.
 */

import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { WeeklyDataReport, CorrelationInsight, MetaAdsMetrics } from '@/types/database'
import type { MarketerAction } from '@/types/actions'

// Using Groq API (same as aiService)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getApiKey(): string | null {
    return import.meta.env.VITE_GROQ_API_KEY || null
}

interface AIMessage {
    role: 'system' | 'user'
    content: string
}

export interface CorrelationContext {
    campaignId: string
    campaignName: string
    phases: ExecutionPhase[]
    tasks: MarketerAction[]
    driftEvents: DriftEvent[]
    weeklyReports: WeeklyDataReport[]
    metaAdsMetrics?: MetaAdsMetrics | null  // Add Meta Ads metrics for correlation
}

interface TaskEvent {
    type: 'delay' | 'early_completion' | 'phase_change' | 'task_completion' | 'ad_launch' | 'ad_pause'
    date: string
    description: string
    phaseName?: string
    taskName?: string
    driftDays?: number
}

interface MetricChange {
    metric: string
    change_pct: number
    previous_value: number
    current_value: number
    source: 'weekly_report' | 'meta_ads'  // Track where metric came from
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
            temperature: 0.5,
            max_tokens: 3000,
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

/**
 * Extract task events from phases, tasks, and drift events
 */
function extractTaskEvents(
    phases: ExecutionPhase[],
    tasks: MarketerAction[],
    driftEvents: DriftEvent[]
): TaskEvent[] {
    const events: TaskEvent[] = []

    // Extract events from drift events
    for (const drift of driftEvents) {
        const eventType = drift.drift_days > 0 ? 'delay' : 'early_completion'
        events.push({
            type: eventType,
            date: drift.created_at,
            description: `${drift.phase_name}: ${drift.drift_days > 0 ? 'delayed by' : 'completed early by'} ${Math.abs(drift.drift_days)} days. ${drift.reason || drift.root_cause || ''}`,
            phaseName: drift.phase_name,
            driftDays: drift.drift_days,
        })
    }

    // Extract phase completion events
    for (const phase of phases) {
        if (phase.status === 'completed' && phase.actual_end_date) {
            events.push({
                type: 'phase_change',
                date: phase.actual_end_date,
                description: `Phase "${phase.phase_name}" completed`,
                phaseName: phase.phase_name,
            })
        }
    }

    // Extract task completion events (for tasks with completion dates)
    for (const task of tasks) {
        if (task.completed_at) {
            const isDelayed = task.due_date && new Date(task.completed_at) > new Date(task.due_date)
            events.push({
                type: isDelayed ? 'delay' : 'task_completion',
                date: task.completed_at,
                description: `Task "${task.title}" ${isDelayed ? 'completed late' : 'completed'}${task.delay_reason ? `: ${task.delay_reason}` : ''}`,
                taskName: task.title,
            })
        }
    }


    // Sort by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Find performance changes around a specific event date
 */
function findPerformanceChanges(
    eventDate: string,
    weeklyReports: WeeklyDataReport[]
): MetricChange[] {
    if (weeklyReports.length < 2) return []

    const eventTime = new Date(eventDate).getTime()

    // Find the report closest to but after the event
    const sortedReports = [...weeklyReports].sort(
        (a, b) => new Date(a.week_starting).getTime() - new Date(b.week_starting).getTime()
    )

    let afterIdx = sortedReports.findIndex(
        r => new Date(r.week_starting).getTime() >= eventTime
    )

    if (afterIdx === -1) afterIdx = sortedReports.length - 1
    if (afterIdx === 0) return []

    const before = sortedReports[afterIdx - 1]
    const after = sortedReports[afterIdx]

    const changes: MetricChange[] = []

    // Check sales change
    if (before.total_sales > 0 && after.total_sales > 0) {
        const changePct = ((after.total_sales - before.total_sales) / before.total_sales) * 100
        if (Math.abs(changePct) >= 5) {
            changes.push({
                metric: 'Total Sales',
                change_pct: changePct,
                previous_value: before.total_sales,
                current_value: after.total_sales,
                source: 'weekly_report',
            })
        }
    }

    // Check engagement change
    if (before.total_engagement > 0 && after.total_engagement > 0) {
        const changePct = ((after.total_engagement - before.total_engagement) / before.total_engagement) * 100
        if (Math.abs(changePct) >= 5) {
            changes.push({
                metric: 'Total Engagement',
                change_pct: changePct,
                previous_value: before.total_engagement,
                current_value: after.total_engagement,
                source: 'weekly_report',
            })
        }
    }

    // Check views change
    const beforeViews = before.facebook_views + before.instagram_views
    const afterViews = after.facebook_views + after.instagram_views
    if (beforeViews > 0 && afterViews > 0) {
        const changePct = ((afterViews - beforeViews) / beforeViews) * 100
        if (Math.abs(changePct) >= 5) {
            changes.push({
                metric: 'Total Views',
                change_pct: changePct,
                previous_value: beforeViews,
                current_value: afterViews,
                source: 'weekly_report',
            })
        }
    }

    // Check revenue change
    if (before.total_revenue > 0 && after.total_revenue > 0) {
        const changePct = ((after.total_revenue - before.total_revenue) / before.total_revenue) * 100
        if (Math.abs(changePct) >= 5) {
            changes.push({
                metric: 'Revenue',
                change_pct: changePct,
                previous_value: before.total_revenue,
                current_value: after.total_revenue,
                source: 'weekly_report',
            })
        }
    }

    return changes
}

/**
 * Determine correlation strength based on timing and magnitude
 */
function determineCorrelationStrength(
    driftDays: number | undefined,
    metricChanges: MetricChange[]
): 'strong' | 'moderate' | 'weak' | 'none' {
    if (metricChanges.length === 0) return 'none'

    const maxChange = Math.max(...metricChanges.map(c => Math.abs(c.change_pct)))

    // Larger metric changes with larger delays = stronger correlation
    if (driftDays && Math.abs(driftDays) >= 3 && maxChange >= 20) return 'strong'
    if (driftDays && Math.abs(driftDays) >= 2 && maxChange >= 15) return 'moderate'
    if (maxChange >= 10) return 'weak'

    return 'none'
}

/**
 * Build the AI prompt for correlation analysis
 */
function buildCorrelationPrompt(
    event: TaskEvent,
    metricChanges: MetricChange[],
    context: CorrelationContext
): AIMessage[] {
    const eventDetails = `
Event Type: ${event.type}
Event Date: ${event.date}
Description: ${event.description}
${event.phaseName ? `Phase: ${event.phaseName}` : ''}
${event.taskName ? `Task: ${event.taskName}` : ''}
${event.driftDays ? `Drift Days: ${event.driftDays}` : ''}
`

    const metricsDetails = metricChanges.length > 0
        ? metricChanges.map(m =>
            `- ${m.metric}: ${m.change_pct > 0 ? '+' : ''}${m.change_pct.toFixed(1)}% (${m.previous_value.toLocaleString()} → ${m.current_value.toLocaleString()}) [source: ${m.source}]`
        ).join('\n')
        : 'No significant metric changes detected.'

    const weeklyReportsSummary = context.weeklyReports.slice(-4).map(r =>
        `  Week of ${r.week_starting}: Sales=$${r.total_revenue.toLocaleString()}, Engagement=${r.total_engagement.toLocaleString()}, Views=${(r.facebook_views + r.instagram_views).toLocaleString()}`
    ).join('\n')

    return [
        {
            role: 'system',
            content: `You are a senior marketing operations analyst reviewing campaign execution data. Your job is to identify specific, actionable insights about how task delays or completions affected campaign performance.

IMPORTANT GUIDELINES:
1. Be SPECIFIC - Always reference the actual numbers, dates, and metric changes
2. Explain WHY - Don't just say "there's a correlation". Explain the marketing logic (e.g., "Late ad launch missed the peak shopping window" or "Early creative approval allowed more A/B testing time")
3. Be practical - Frame insights as lessons a marketing manager would care about
4. Avoid generic phrases like "there is causality", "correlation detected", "performance was impacted"
5. If confidence is low, say exactly what data is missing or unclear

Return ONLY valid JSON in this format:
{
  "performance_impact": "positive" | "negative" | "neutral" | "unknown",
  "correlation_strength": "strong" | "moderate" | "weak" | "none",
  "ai_analysis": "2-3 sentences explaining SPECIFICALLY what happened and WHY it affected performance. Reference actual metrics and timing.",
  "confidence": 0-100,
  "reason_chain": "One sentence stating the causal chain: [Task Event] → [Marketing Mechanism] → [Performance Outcome]",
  "actionable_insight": "One concrete recommendation with specific action or threshold (e.g., 'Aim for creative approval 5+ days before launch to allow testing time')"
}`
        },
        {
            role: 'user',
            content: `Campaign: ${context.campaignName}

TASK EVENT THAT OCCURRED:
${eventDetails}

PERFORMANCE CHANGES OBSERVED AFTER THIS EVENT:
${metricsDetails}

WEEKLY PERFORMANCE TREND:
${weeklyReportsSummary}

Based on this data:
1. Did this task event likely CAUSE the performance changes? If yes, explain the marketing mechanism (e.g., missed timing window, ad fatigue, audience attention).
2. What's the specific lesson here for future campaigns?  

Return ONLY valid JSON.`
        }
    ]
}

/**
 * Parse AI response into structured insight
 */
function parseAIResponse(raw: string, event: TaskEvent, metricChanges: MetricChange[]): Partial<CorrelationInsight> {
    try {
        let jsonStr = raw.trim()
        const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
            jsonStr = jsonMatch[1]
        }

        const parsed = JSON.parse(jsonStr)

        // Combine reason_chain with analysis for richer context
        let analysis = parsed.ai_analysis || 'Unable to analyze correlation.'
        if (parsed.reason_chain) {
            analysis = `**Why:** ${parsed.reason_chain}\n\n${analysis}`
        }

        return {
            performance_impact: parsed.performance_impact || 'unknown',
            correlation_strength: parsed.correlation_strength || determineCorrelationStrength(event.driftDays, metricChanges),
            ai_analysis: analysis,
            confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
            actionable_insight: parsed.actionable_insight,
        }
    } catch (e) {
        console.error('Failed to parse AI correlation response:', e)
        return {
            performance_impact: 'unknown',
            correlation_strength: determineCorrelationStrength(event.driftDays, metricChanges),
            ai_analysis: 'Unable to analyze correlation due to AI parsing error.',
            confidence: 30,
        }
    }
}

/**
 * Main function: Analyze correlations between task events and performance
 */
export async function analyzeTaskPerformanceCorrelation(
    context: CorrelationContext
): Promise<CorrelationInsight[]> {
    const { phases, tasks, driftEvents, weeklyReports } = context

    if (weeklyReports.length === 0) {
        return [] // Need performance data to correlate
    }

    const taskEvents = extractTaskEvents(phases, tasks, driftEvents)
    const insights: CorrelationInsight[] = []

    for (const event of taskEvents) {
        const metricChanges = findPerformanceChanges(event.date, weeklyReports)

        // Skip if no meaningful changes
        if (metricChanges.length === 0 && event.type !== 'delay') {
            continue
        }

        let aiAnalysis: Partial<CorrelationInsight>

        try {
            const messages = buildCorrelationPrompt(event, metricChanges, context)
            const rawResponse = await callAI(messages)
            aiAnalysis = parseAIResponse(rawResponse, event, metricChanges)
        } catch (error) {
            console.error('AI analysis failed for event:', event, error)
            // Fallback to rule-based analysis
            aiAnalysis = {
                performance_impact: metricChanges.some(c => c.change_pct < -5) ? 'negative' :
                    metricChanges.some(c => c.change_pct > 5) ? 'positive' : 'neutral',
                correlation_strength: determineCorrelationStrength(event.driftDays, metricChanges),
                ai_analysis: `${event.description}. ${metricChanges.length > 0 ?
                    `Performance changes detected: ${metricChanges.map(c => `${c.metric} ${c.change_pct > 0 ? 'increased' : 'decreased'} ${Math.abs(c.change_pct).toFixed(1)}%`).join(', ')}.` :
                    'No significant performance changes detected around this event.'}`,
                confidence: 40,
            }
        }

        const insight: CorrelationInsight = {
            id: crypto.randomUUID(),
            campaign_id: context.campaignId,
            created_at: new Date().toISOString(),
            event_type: event.type,
            event_description: event.description,
            event_date: event.date,
            phase_name: event.phaseName,
            task_name: event.taskName,
            metric_changes: metricChanges,
            ...aiAnalysis as Omit<CorrelationInsight, 'id' | 'campaign_id' | 'created_at' | 'event_type' | 'event_description' | 'event_date' | 'phase_name' | 'task_name' | 'metric_changes'>
        }

        insights.push(insight)
    }

    // Sort by confidence (highest first) then by correlation strength
    return insights.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence
        const strengthOrder = { strong: 3, moderate: 2, weak: 1, none: 0 }
        return strengthOrder[b.correlation_strength] - strengthOrder[a.correlation_strength]
    })
}

/**
 * Generate a summary of all correlations for a campaign
 */
export function summarizeCorrelations(insights: CorrelationInsight[]): {
    totalEvents: number
    positiveImpacts: number
    negativeImpacts: number
    strongCorrelations: number
    keyInsight: string | null
} {
    const positiveImpacts = insights.filter(i => i.performance_impact === 'positive').length
    const negativeImpacts = insights.filter(i => i.performance_impact === 'negative').length
    const strongCorrelations = insights.filter(i => i.correlation_strength === 'strong').length

    // Find the most significant insight
    const keyInsight = insights.find(i => i.correlation_strength === 'strong' && i.confidence >= 70)
        ?.ai_analysis || null

    return {
        totalEvents: insights.length,
        positiveImpacts,
        negativeImpacts,
        strongCorrelations,
        keyInsight,
    }
}

export function isApiKeyConfigured(): boolean {
    return !!getApiKey()
}
