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

/**
 * Calculate phase-level drift from aggregated task time data
 * @param taskTimeMinutes - Total time spent on all tasks in the phase (in minutes)
 * @param plannedDurationDays - Planned phase duration in days
 * @returns Drift in days (positive = over, negative = under)
 */
export function calculatePhaseDriftFromTasks(
  taskTimeMinutes: number,
  plannedDurationDays: number
): number {
  const actualDays = taskTimeMinutes / (60 * 24) // Convert minutes to days
  return Math.round(actualDays - plannedDurationDays)
}

/**
 * Format minutes into human-readable time string
 * @param minutes - Time in minutes
 * @returns Formatted string (e.g., "2.5h", "1.2d")
 */
export function formatTimeFromMinutes(minutes: number): string {
  const hours = minutes / 60
  if (hours < 24) {
    return `${hours.toFixed(1)}h`
  }
  const days = hours / 24
  return `${days.toFixed(1)}d`
}

// ============================================================================
// UNIFIED PHASE-TASK TRACKING CALCULATIONS
// ============================================================================

export interface TaskPhasePerformance {
  status: 'on-time' | 'at-risk' | 'overdue'
  timeSpentMinutes: number
  expectedMinutes: number
  driftMinutes: number
  driftDays: number
}

/**
 * Calculate how a task performed in a specific phase
 * @param timeSpentMinutes - Time the task spent in the phase
 * @param plannedDurationDays - Phase's planned duration in days
 * @returns Performance metrics for the task in that phase
 */
export function calculateTaskPhasePerformance(
  timeSpentMinutes: number,
  plannedDurationDays: number
): TaskPhasePerformance {
  // Expected time is the full phase duration (as guideline)
  const expectedMinutes = plannedDurationDays * 24 * 60
  const driftMinutes = timeSpentMinutes - expectedMinutes
  const driftDays = driftMinutes / (24 * 60)
  
  // Status based on percentage of expected time
  const percentageUsed = timeSpentMinutes / expectedMinutes
  let status: 'on-time' | 'at-risk' | 'overdue'
  
  if (percentageUsed <= 1.0) {
    status = 'on-time'
  } else if (percentageUsed <= 1.5) {
    status = 'at-risk'
  } else {
    status = 'overdue'
  }
  
  return {
    status,
    timeSpentMinutes,
    expectedMinutes,
    driftMinutes,
    driftDays: parseFloat(driftDays.toFixed(2))
  }
}

export interface PhaseAggregateMetrics {
  phaseId: string
  phaseName: string
  plannedDurationDays: number
  
  // Task counts
  totalTasksCompleted: number
  totalTasksActive: number
  
  // Time metrics
  totalTimeSpentMinutes: number
  avgTimeSpentMinutes: number
  avgTimeSpentDays: number
  
  // Drift
  totalDriftMinutes: number
  totalDriftDays: number
  avgDriftDays: number
  
  // Performance
  onTimeCount: number
  atRiskCount: number
  overdueCount: number
  onTimePercentage: number
}

/**
 * Calculate aggregate metrics for a phase based on all tasks that passed through it
 * @param phaseId - Phase ID
 * @param phaseName - Phase name
 * @param plannedDurationDays - Phase planned duration
 * @param completedHistory - Task phase history entries for completed tasks
 * @param activeTasks - Tasks currently in this phase
 * @returns Aggregate metrics for the phase
 */
export function calculatePhaseAggregateMetrics(
  phaseId: string,
  phaseName: string,
  plannedDurationDays: number,
  completedHistory: Array<{ time_spent_minutes: number | null }>,
  activeTasks: Array<{ time_in_phase_minutes?: number }>
): PhaseAggregateMetrics {
  // Calculate completed tasks metrics
  const completedTimes = completedHistory
    .map(h => h.time_spent_minutes || 0)
    .filter(t => t > 0)
  
  const totalCompletedTime = completedTimes.reduce((sum, t) => sum + t, 0)
  
  // Add active task times
  const activeTimes = activeTasks
    .map(t => t.time_in_phase_minutes || 0)
    .filter(t => t > 0)
  
  const totalActiveTime = activeTimes.reduce((sum, t) => sum + t, 0)
  
  // Combined metrics
  const totalTimeSpentMinutes = totalCompletedTime + totalActiveTime
  const totalTasks = completedTimes.length + activeTimes.length
  const avgTimeSpentMinutes = totalTasks > 0 ? totalTimeSpentMinutes / totalTasks : 0
  const avgTimeSpentDays = avgTimeSpentMinutes / (24 * 60)
  
  // Calculate drift
  const expectedMinutesPerTask = plannedDurationDays * 24 * 60
  const totalDriftMinutes = totalTimeSpentMinutes - (expectedMinutesPerTask * totalTasks)
  const totalDriftDays = totalDriftMinutes / (24 * 60)
  const avgDriftDays = totalTasks > 0 ? totalDriftDays / totalTasks : 0
  
  // Calculate performance distribution
  let onTimeCount = 0
  let atRiskCount = 0
  let overdueCount = 0
  
  const allTimes = [...completedTimes, ...activeTimes]
  allTimes.forEach(timeSpent => {
    const performance = calculateTaskPhasePerformance(timeSpent, plannedDurationDays)
    if (performance.status === 'on-time') onTimeCount++
    else if (performance.status === 'at-risk') atRiskCount++
    else overdueCount++
  })
  
  const onTimePercentage = totalTasks > 0 ? (onTimeCount / totalTasks) * 100 : 0
  
  return {
    phaseId,
    phaseName,
    plannedDurationDays,
    totalTasksCompleted: completedTimes.length,
    totalTasksActive: activeTimes.length,
    totalTimeSpentMinutes,
    avgTimeSpentMinutes,
    avgTimeSpentDays: parseFloat(avgTimeSpentDays.toFixed(2)),
    totalDriftMinutes,
    totalDriftDays: parseFloat(totalDriftDays.toFixed(2)),
    avgDriftDays: parseFloat(avgDriftDays.toFixed(2)),
    onTimeCount,
    atRiskCount,
    overdueCount,
    onTimePercentage: parseFloat(onTimePercentage.toFixed(1))
  }
}

/**
 * Calculate health status for a task currently in a phase
 * @param timeInPhaseMinutes - Time task has spent in current phase
 * @param plannedDurationDays - Phase planned duration
 * @returns Current health status
 */
export function calculateTaskHealthInCurrentPhase(
  timeInPhaseMinutes: number,
  plannedDurationDays: number
): 'on-time' | 'at-risk' | 'overdue' {
  const expectedMinutes = plannedDurationDays * 24 * 60
  const percentageUsed = timeInPhaseMinutes / expectedMinutes
  
  if (percentageUsed <= 0.8) return 'on-time'
  if (percentageUsed <= 1.0) return 'at-risk'
  return 'overdue'
}

export interface OperationsHealth {
  score: number // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  factors: {
    flowVelocity: number // 0-100
    bottleneckScore: number // 0-100
    completionRate: number // 0-100
    onTimeRate: number // 0-100
  }
  trend: 'improving' | 'stable' | 'declining'
  insights: string[]
}

/**
 * Calculate overall operations health from task flow through phases
 * @param allMetrics - Aggregate metrics for all phases
 * @param totalTasks - Total number of tasks
 * @returns Overall operations health score and breakdown
 */
export function calculateOperationsHealthFromTaskFlow(
  allMetrics: PhaseAggregateMetrics[],
  totalTasks: number
): OperationsHealth {
  if (allMetrics.length === 0 || totalTasks === 0) {
    return {
      score: 100,
      status: 'excellent',
      factors: {
        flowVelocity: 100,
        bottleneckScore: 100,
        completionRate: 0,
        onTimeRate: 100
      },
      trend: 'stable',
      insights: ['No tasks in progress yet']
    }
  }
  
  // Flow Velocity: How close avg time is to planned time across phases
  const velocityScores = allMetrics.map(m => {
    if (m.avgTimeSpentDays === 0) return 100
    const ratio = m.plannedDurationDays / m.avgTimeSpentDays
    // Optimal is 1.0 (taking exactly planned time), score drops as ratio deviates
    return Math.max(0, Math.min(100, ratio * 100))
  })
  const flowVelocity = velocityScores.length > 0 
    ? velocityScores.reduce((a, b) => a + b, 0) / velocityScores.length 
    : 100
  
  // Bottleneck Score: Penalty for tasks stuck (>2x expected time)
  const totalActiveAndCompleted = allMetrics.reduce(
    (sum, m) => sum + m.totalTasksActive + m.totalTasksCompleted, 
    0
  )
  const stuckCount = allMetrics.reduce(
    (sum, m) => sum + m.overdueCount, 
    0
  )
  const bottleneckScore = totalActiveAndCompleted > 0
    ? ((totalActiveAndCompleted - stuckCount) / totalActiveAndCompleted) * 100
    : 100
  
  // Completion Rate: Tasks completed vs total
  const totalCompleted = allMetrics.reduce((sum, m) => sum + m.totalTasksCompleted, 0)
  const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0
  
  // On-Time Rate: Weighted average of on-time percentage across phases
  const onTimeRate = allMetrics.length > 0
    ? allMetrics.reduce((sum, m) => sum + m.onTimePercentage, 0) / allMetrics.length
    : 100
  
  // Overall score (weighted average)
  const score = Math.round(
    flowVelocity * 0.25 +
    bottleneckScore * 0.25 +
    completionRate * 0.25 +
    onTimeRate * 0.25
  )
  
  // Determine status
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  if (score >= 90) status = 'excellent'
  else if (score >= 70) status = 'good'
  else if (score >= 50) status = 'fair'
  else if (score >= 30) status = 'poor'
  else status = 'critical'
  
  // Generate insights
  const insights: string[] = []
  if (flowVelocity < 70) insights.push('Tasks taking longer than expected')
  if (bottleneckScore < 70) insights.push(`${stuckCount} tasks stuck in phases`)
  if (onTimeRate < 60) insights.push('Many tasks exceeding phase durations')
  if (completionRate < 30) insights.push('Low completion rate')
  if (insights.length === 0) insights.push('Operations running smoothly')
  
  return {
    score,
    status,
    factors: {
      flowVelocity: Math.round(flowVelocity),
      bottleneckScore: Math.round(bottleneckScore),
      completionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate)
    },
    trend: 'stable', // Would need historical data to calculate
    insights
  }
}
