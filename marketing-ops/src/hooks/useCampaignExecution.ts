import { useState, useEffect, useCallback } from 'react'
import { campaignExecutionService } from '@/services/campaignExecutionService'
import type { ExecutionPhase } from '@/types/phase'
import type { 
  MarketerAction, 
  TaskPhaseHistory,
  MarketerActionInsert 
} from '@/types/actions'

interface UseCampaignExecutionReturn {
  phases: ExecutionPhase[]
  tasks: MarketerAction[]
  history: TaskPhaseHistory[]
  loading: boolean
  error: string | null
  // Operations that update local state immediately
  createTask: (taskData: MarketerActionInsert) => Promise<MarketerAction>
  updateTask: (taskId: string, updates: Partial<MarketerAction>) => Promise<MarketerAction>
  moveTaskToPhase: (
    taskId: string,
    newPhaseId: string | null,
    oldPhaseId: string | null
  ) => Promise<MarketerAction>
  deleteTask: (taskId: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Unified hook for managing campaign execution data
 * Provides immediate local state updates + real-time sync
 */
export function useCampaignExecution(
  campaignId: string | undefined
): UseCampaignExecutionReturn {
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [tasks, setTasks] = useState<MarketerAction[]>([])
  const [history, setHistory] = useState<TaskPhaseHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!campaignId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const data = await campaignExecutionService.fetchCampaignData(campaignId)
      
      setPhases(data.phases)
      setTasks(data.tasks)
      setHistory(data.history)
    } catch (err) {
      console.error('[useCampaignExecution] Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  // Set up real-time subscription
  useEffect(() => {
    if (!campaignId) return

    const unsubscribe = campaignExecutionService.setupRealtimeSubscription(
      campaignId,
      () => {
        // Refetch on external changes (other users, etc.)
        console.log('[useCampaignExecution] Real-time update received, refetching...')
        fetchData()
      }
    )

    return unsubscribe
  }, [campaignId, fetchData])

  // Create task with immediate local update
  const createTask = useCallback(async (taskData: MarketerActionInsert): Promise<MarketerAction> => {
    try {
      const newTask = await campaignExecutionService.createTask(taskData)
      
      // Immediately update local state
      setTasks(prev => [newTask, ...prev])
      
      // If task has a phase, create history entry locally
      if (newTask.phase_id) {
        const phase = phases.find(p => p.id === newTask.phase_id)
        if (phase) {
          const historyEntry: TaskPhaseHistory = {
            id: crypto.randomUUID(), // Temporary ID
            action_id: newTask.id,
            phase_id: newTask.phase_id,
            phase_name: phase.phase_name,
            entered_at: newTask.timestamp || new Date().toISOString(),
            exited_at: null,
            time_spent_minutes: null,
            created_at: new Date().toISOString(),
          }
          setHistory(prev => [historyEntry, ...prev])
        }
      }
      
      return newTask
    } catch (err) {
      console.error('[useCampaignExecution] Error creating task:', err)
      throw err
    }
  }, [phases])

  // Update task with immediate local update
  const updateTask = useCallback(async (
    taskId: string, 
    updates: Partial<MarketerAction>
  ): Promise<MarketerAction> => {
    if (!campaignId) throw new Error('No campaign ID')

    try {
      const updatedTask = await campaignExecutionService.updateTask(taskId, updates, campaignId)
      
      // Immediately update local state
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))
      
      return updatedTask
    } catch (err) {
      console.error('[useCampaignExecution] Error updating task:', err)
      throw err
    }
  }, [campaignId])

  // Move task to phase with immediate local update
  const moveTaskToPhase = useCallback(async (
    taskId: string,
    newPhaseId: string | null,
    oldPhaseId: string | null
  ): Promise<MarketerAction> => {
    if (!campaignId) throw new Error('No campaign ID')

    try {
      const phase = newPhaseId ? phases.find(p => p.id === newPhaseId) : null
      const isLastPhase = phase ? phase.phase_number === Math.max(...phases.map(p => p.phase_number)) : false
      
      // Optimistically update local state first
      const now = new Date().toISOString()
      const optimisticStatus = isLastPhase ? 'completed' : (newPhaseId ? 'in_progress' : 'planned')
      
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              phase_id: newPhaseId, 
              status: optimisticStatus,
              started_at: now,
              time_in_phase_minutes: 0,
              ...(isLastPhase ? { completed_at: now } : {})
            } 
          : t
      ))

      // Close old history entry
      if (oldPhaseId) {
        setHistory(prev => prev.map(h =>
          h.action_id === taskId && h.exited_at === null
            ? { ...h, exited_at: now }
            : h
        ))
      }

      // Add new history entry
      if (newPhaseId && phase) {
        const newHistoryEntry: TaskPhaseHistory = {
          id: crypto.randomUUID(), // Temporary ID
          action_id: taskId,
          phase_id: newPhaseId,
          phase_name: phase.phase_name,
          entered_at: now,
          exited_at: null,
          time_spent_minutes: null,
          created_at: now,
        }
        setHistory(prev => [newHistoryEntry, ...prev])
      }

      // Then make the server call
      const updatedTask = await campaignExecutionService.moveTaskToPhase(
        taskId,
        newPhaseId,
        phase || null,
        oldPhaseId,
        isLastPhase,
        campaignId
      )
      
      return updatedTask
    } catch (err) {
      console.error('[useCampaignExecution] Error moving task:', err)
      // Revert optimistic update on error
      fetchData()
      throw err
    }
  }, [campaignId, phases, fetchData])

  // Delete task with immediate local update
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!campaignId) throw new Error('No campaign ID')

    try {
      // Optimistically remove from local state
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setHistory(prev => prev.filter(h => h.action_id !== taskId))

      // Then make the server call
      await campaignExecutionService.deleteTask(taskId, campaignId)
    } catch (err) {
      console.error('[useCampaignExecution] Error deleting task:', err)
      // Revert optimistic update on error
      fetchData()
      throw err
    }
  }, [campaignId, fetchData])

  return {
    phases,
    tasks,
    history,
    loading,
    error,
    createTask,
    updateTask,
    moveTaskToPhase,
    deleteTask,
    refetch: fetchData,
  }
}
