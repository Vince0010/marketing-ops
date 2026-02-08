import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ExecutionPhase } from '@/types/phase'
import type { MarketerAction, TaskPhaseHistory } from '@/types/actions'
import {
  calculatePhaseAggregateMetrics,
  calculateOperationsHealthFromTaskFlow,
  type PhaseAggregateMetrics,
  type OperationsHealth
} from '@/utils/calculations'

export interface PhaseTrackingData {
  phases: ExecutionPhase[]
  tasks: MarketerAction[]
  history: TaskPhaseHistory[]
  phaseMetrics: Map<string, PhaseAggregateMetrics>
  operationsHealth: OperationsHealth
  tasksInPhase: Map<string, MarketerAction[]>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Optional external data to sync with useCampaignExecution
 * When provided, the hook uses this data instead of fetching its own
 */
export interface ExternalExecutionData {
  phases: ExecutionPhase[]
  tasks: MarketerAction[]
  history: TaskPhaseHistory[]
}

/**
 * Hook for unified phase-task tracking data
 * Fetches phases, tasks, and history, then calculates real-time metrics
 * 
 * @param campaignId - The campaign to track
 * @param externalData - Optional external data from useCampaignExecution for shared state
 */
export function usePhaseTracking(
  campaignId: string | undefined,
  externalData?: ExternalExecutionData
): PhaseTrackingData {
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [tasks, setTasks] = useState<MarketerAction[]>([])
  const [history, setHistory] = useState<TaskPhaseHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use external data if provided (syncs with useCampaignExecution)
  const effectivePhases = externalData?.phases ?? phases
  const effectiveTasks = externalData?.tasks ?? tasks
  const effectiveHistory = externalData?.history ?? history

  // Stable fetch function using useCallback
  const fetchData = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false)
      return
    }

    try {
      console.log('[usePhaseTracking] Fetching data for campaign:', campaignId)
      setError(null)

      // Fetch all data in parallel
      const [phasesRes, tasksRes] = await Promise.all([
        supabase
          .from('execution_phases')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('phase_number'),
        supabase
          .from('marketer_actions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
      ])

      if (phasesRes.error) throw phasesRes.error
      if (tasksRes.error) throw tasksRes.error

      // Fetch history for fetched tasks
      const taskIds = tasksRes.data?.map(t => t.id) || []
      const historyRes = taskIds.length > 0
        ? await supabase
          .from('task_phase_history')
          .select('*')
          .in('action_id', taskIds)
          .order('entered_at', { ascending: false })
        : { data: [], error: null }

      if (historyRes.error) throw historyRes.error

      console.log('[usePhaseTracking] Data fetched:', {
        phases: phasesRes.data?.length || 0,
        tasks: tasksRes.data?.length || 0,
        history: historyRes.data?.length || 0
      })

      setPhases(phasesRes.data || [])
      setTasks(tasksRes.data || [])
      setHistory(historyRes.data || [])
    } catch (err) {
      console.error('[usePhaseTracking] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [campaignId])

  // Fetch on mount and when campaignId changes (skip when using external data)
  useEffect(() => {
    if (externalData) {
      // Using external data, no need to fetch
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetchData()
  }, [fetchData, externalData])

  // Set up real-time subscriptions (skip when using external data - parent handles it)
  useEffect(() => {
    if (!campaignId || externalData) return

    console.log('[usePhaseTracking] Setting up subscriptions for campaign:', campaignId)

    // Single channel with multiple listeners
    const channel = supabase
      .channel(`campaign_tracking_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketer_actions',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('[usePhaseTracking] Task changed:', payload.eventType)
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_phase_history',
        },
        (payload) => {
          console.log('[usePhaseTracking] History changed:', payload.eventType)
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_phases',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('[usePhaseTracking] Phase changed:', payload.eventType)
          fetchData()
        }
      )
      .subscribe((status) => {
        console.log('[usePhaseTracking] Subscription status:', status)
      })

    return () => {
      console.log('[usePhaseTracking] Cleaning up subscriptions')
      supabase.removeChannel(channel)
    }
  }, [campaignId, fetchData])

  // Calculate derived data using effective data (external or local)
  const { phaseMetrics, tasksInPhase, operationsHealth } = useMemo(() => {
    console.log('[usePhaseTracking] Calculating metrics for:', {
      phases: effectivePhases.length,
      tasks: effectiveTasks.length,
      history: effectiveHistory.length,
      usingExternalData: !!externalData
    })

    const metrics = new Map<string, PhaseAggregateMetrics>()
    const tasksByPhase = new Map<string, MarketerAction[]>()

    // Group tasks by current phase
    effectiveTasks.forEach(task => {
      if (task.phase_id) {
        const existing = tasksByPhase.get(task.phase_id) || []
        tasksByPhase.set(task.phase_id, [...existing, task])
      }
    })

    console.log('[usePhaseTracking] Tasks by phase:',
      Array.from(tasksByPhase.entries()).map(([phaseId, phaseTasks]) => {
        const phase = effectivePhases.find(p => p.id === phaseId)
        return {
          phaseName: phase?.phase_name || phaseId,
          count: phaseTasks.length
        }
      })
    )

    // Calculate metrics for each phase
    effectivePhases.forEach(phase => {
      // Get completed history for this phase
      const completedHistory = effectiveHistory.filter(
        h => h.phase_id === phase.id && h.exited_at !== null
      )

      // Get active tasks in this phase
      const activeTasks = tasksByPhase.get(phase.id) || []

      // Calculate aggregate metrics
      const phaseMetric = calculatePhaseAggregateMetrics(
        phase.id,
        phase.phase_name,
        phase.planned_duration_days,
        completedHistory,
        activeTasks
      )

      console.log(`[usePhaseTracking] Metrics for ${phase.phase_name}:`, {
        completedCount: completedHistory.length,
        activeCount: activeTasks.length,
        totalTasks: phaseMetric.totalTasksCompleted + phaseMetric.totalTasksActive
      })

      metrics.set(phase.id, phaseMetric)
    })

    // Calculate overall operations health
    const allMetrics = Array.from(metrics.values())
    const health = calculateOperationsHealthFromTaskFlow(allMetrics, effectiveTasks.length)

    console.log('[usePhaseTracking] Operations health:', health.score, health.status)

    return {
      phaseMetrics: metrics,
      tasksInPhase: tasksByPhase,
      operationsHealth: health
    }
  }, [effectivePhases, effectiveTasks, effectiveHistory, externalData])

  return {
    phases: effectivePhases,
    tasks: effectiveTasks,
    history: effectiveHistory,
    phaseMetrics,
    operationsHealth,
    tasksInPhase,
    isLoading: externalData ? false : isLoading,
    error: externalData ? null : error,
    refetch: fetchData
  }
}
