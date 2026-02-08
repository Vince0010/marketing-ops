export function calculateRiskScore(campaign: any): number {
  // Simplified risk calculation for hackathon
  let score = 100

  // Budget risk
  if (campaign.total_budget < 1000) score -= 20

  // Timeline risk
  const duration = new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()
  const durationDays = duration / (1000 * 60 * 60 * 24)
  if (durationDays < 14) score -= 15

  // First campaign risk
  if (!campaign.historical_context?.similar_campaigns?.length) score -= 10

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

