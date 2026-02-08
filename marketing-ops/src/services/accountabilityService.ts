/**
 * Accountability Service
 * 
 * Manages stakeholder actions, approval tracking, and delay attribution
 * Implements the accountability mapping from the design documents
 */

import { supabase } from '@/lib/supabase'
import type { StakeholderAction } from '@/types/database'

interface AccountabilitySummary {
  total_actions: number
  completed: number
  overdue: number
  pending: number
  client_delays: number
  agency_delays: number
  external_delays: number
  critical_path_delays: number
  avg_delay_days: number
  on_time_percentage: number
}

/**
 * Fetch all stakeholder actions for a campaign
 */
export async function fetchStakeholderActions(campaignId: string): Promise<{
  data: StakeholderAction[] | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('stakeholder_actions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('requested_date', { ascending: false })

    if (error) {
      return { data: null, error }
    }

    return { data: data as StakeholderAction[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Create a new stakeholder action
 */
export async function createStakeholderAction(
  action: Omit<StakeholderAction, 'id' | 'created_at'>
): Promise<{
  data: StakeholderAction | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('stakeholder_actions')
      .insert(action)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: data as StakeholderAction, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Update a stakeholder action
 */
export async function updateStakeholderAction(
  id: string,
  updates: Partial<StakeholderAction>
): Promise<{
  data: StakeholderAction | null
  error: Error | null
}> {
  try {
    const { data, error } = await supabase
      .from('stakeholder_actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    return { data: data as StakeholderAction, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Calculate accountability summary for a campaign
 */
export function calculateAccountabilitySummary(actions: StakeholderAction[]): AccountabilitySummary {
  const total = actions.length

  if (total === 0) {
    return {
      total_actions: 0,
      completed: 0,
      overdue: 0,
      pending: 0,
      client_delays: 0,
      agency_delays: 0,
      external_delays: 0,
      critical_path_delays: 0,
      avg_delay_days: 0,
      on_time_percentage: 100
    }
  }

  const completed = actions.filter(a => a.status === 'completed').length
  const overdue = actions.filter(a => a.status === 'overdue' || (
    a.expected_date && 
    new Date(a.expected_date) < new Date() && 
    a.status !== 'completed'
  )).length
  const pending = actions.filter(a => 
    a.status === 'pending' || a.status === 'in_progress'
  ).length

  // Count delays by attribution
  const client_delays = actions.filter(a => a.delay_attribution === 'client').length
  const agency_delays = actions.filter(a => a.delay_attribution === 'agency').length
  const external_delays = actions.filter(a => a.delay_attribution === 'external').length

  // Critical path delays
  const critical_path_delays = actions.filter(a => 
    a.critical_path && (a.status === 'overdue' || a.overdue_days && a.overdue_days > 0)
  ).length

  // Calculate average delay for delayed actions
  const delayedActions = actions.filter(a => a.overdue_days && a.overdue_days > 0)
  const avg_delay_days = delayedActions.length > 0
    ? delayedActions.reduce((sum, a) => sum + (a.overdue_days || 0), 0) / delayedActions.length
    : 0

  // On-time completion percentage
  const completedActions = actions.filter(a => a.status === 'completed')
  const onTimeActions = completedActions.filter(a => {
    if (!a.expected_date || !a.actual_date) return true
    return new Date(a.actual_date) <= new Date(a.expected_date)
  })
  const on_time_percentage = completedActions.length > 0
    ? (onTimeActions.length / completedActions.length) * 100
    : 100

  return {
    total_actions: total,
    completed,
    overdue,
    pending,
    client_delays,
    agency_delays,
    external_delays,
    critical_path_delays,
    avg_delay_days: Math.round(avg_delay_days * 10) / 10,
    on_time_percentage: Math.round(on_time_percentage)
  }
}

/**
 * Get actions grouped by phase
 */
export function groupActionsByPhase(actions: StakeholderAction[]): Map<string, StakeholderAction[]> {
  const grouped = new Map<string, StakeholderAction[]>()

  actions.forEach(action => {
    const phaseId = action.phase_id || 'unassigned'
    const existing = grouped.get(phaseId) || []
    grouped.set(phaseId, [...existing, action])
  })

  return grouped
}

/**
 * Mark an action as complete
 */
export async function completeStakeholderAction(
  id: string,
  actual_date?: string
): Promise<{
  data: StakeholderAction | null
  error: Error | null
}> {
  const completionDate = actual_date || new Date().toISOString().split('T')[0]

  return updateStakeholderAction(id, {
    status: 'completed',
    actual_date: completionDate
  })
}

/**
 * Calculate overdue days for an action
 */
export function calculateOverdueDays(action: StakeholderAction): number {
  if (action.status === 'completed' && action.actual_date && action.expected_date) {
    const expected = new Date(action.expected_date)
    const actual = new Date(action.actual_date)
    const diffTime = actual.getTime() - expected.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (action.status !== 'completed' && action.expected_date) {
    const expected = new Date(action.expected_date)
    const now = new Date()
    const diffTime = now.getTime() - expected.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return 0
}

/**
 * Get delay attribution breakdown
 */
export interface DelayBreakdown {
  attribution: 'client' | 'agency' | 'external' | 'force_majeure' | null
  count: number
  total_days: number
  percentage: number
}

export function getDelayBreakdown(actions: StakeholderAction[]): DelayBreakdown[] {
  const delayedActions = actions.filter(a => a.delay_attribution && (a.overdue_days || 0) > 0)

  if (delayedActions.length === 0) {
    return []
  }

  const breakdownMap = new Map<string, { count: number; total_days: number }>()

  delayedActions.forEach(action => {
    const attribution = action.delay_attribution || 'unknown'
    const existing = breakdownMap.get(attribution) || { count: 0, total_days: 0 }
    breakdownMap.set(attribution, {
      count: existing.count + 1,
      total_days: existing.total_days + (action.overdue_days || 0)
    })
  })

  const totalDelays = delayedActions.length

  return Array.from(breakdownMap.entries()).map(([attribution, data]) => ({
    attribution: attribution as 'client' | 'agency' | 'external' | 'force_majeure' | null,
    count: data.count,
    total_days: data.total_days,
    percentage: Math.round((data.count / totalDelays) * 100)
  })).sort((a, b) => b.count - a.count)
}
