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
        oldPhaseId: string | null,
        delayReason?: string,
        restartPhase?: boolean
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
            const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
            
            // Provide more helpful error message if backend is down
            if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
                setError('Cannot connect to backend server. Make sure the API server is running on port 3001. Run: npm run dev:all')
            } else {
                setError(errorMessage)
            }
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
            // Auto-generate planned_timeline if not provided and phases exist
            if (!taskData.planned_timeline && phases.length > 0) {
                const plannedTimelineMap: Record<string, { phase_name: string; planned_minutes: number; phase_number: number }> = {}
                phases.forEach(phase => {
                    plannedTimelineMap[phase.id] = {
                        phase_name: phase.phase_name,
                        planned_minutes: phase.planned_duration_days * 8 * 60, // Convert days to minutes (8-hour workdays)
                        phase_number: phase.phase_number
                    }
                })
                taskData.planned_timeline = plannedTimelineMap
                console.log('[useCampaignExecution] Auto-generated planned_timeline for new task:', plannedTimelineMap)
            }

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
        oldPhaseId: string | null,
        delayReason?: string,
        restartPhase?: boolean
    ): Promise<MarketerAction> => {
        if (!campaignId) throw new Error('No campaign ID')

        try {
            // Find phase using functional update to get current state (avoid stale closure)
            let phase: ExecutionPhase | null = null
            let isLastPhase = false
            
            setPhases(currentPhases => {
                if (newPhaseId) {
                    const foundPhase = currentPhases.find(p => p.id === newPhaseId)
                    if (foundPhase) {
                        phase = foundPhase
                        const maxPhaseNum = Math.max(...currentPhases.map(p => p.phase_number))
                        isLastPhase = foundPhase.phase_number === maxPhaseNum
                    }
                }
                return currentPhases // No change, just reading
            })
            
            // Debug logging
            console.log('[Hook] Moving task:', {
                taskId,
                newPhaseId,
                oldPhaseId,
                foundPhase: phase?.phase_name || 'null',
                totalPhasesAvailable: phases.length
            })
            
            if (newPhaseId && !phase) {
                console.error('[Hook] Phase not found! newPhaseId:', newPhaseId, 'Available phases:', phases.map(p => ({ id: p.id, name: p.phase_name })))
                throw new Error(`Phase ${newPhaseId} not found`)
            }
            
            // Optimistically update local state first
            const now = new Date().toISOString()
            const optimisticStatus = isLastPhase ? 'completed' : (newPhaseId ? 'in_progress' : 'planned')

            // Calculate carry-over time if moving back to a previous phase (unless restarting)
            let carryOverMinutes = 0
            if (newPhaseId && !restartPhase) {
                setHistory(currentHistory => {
                    const prevEntries = currentHistory.filter(
                        h => h.action_id === taskId && h.phase_id === newPhaseId && h.exited_at !== null
                    )
                    carryOverMinutes = prevEntries.reduce((sum, h) => sum + (h.time_spent_minutes || 0), 0)
                    console.log('[Hook] Optimistic carry-over:', carryOverMinutes, 'minutes for phase', newPhaseId)
                    return currentHistory // No change
                })
            }

            // Optimistically update local state first
            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? {
                        ...t,
                        phase_id: newPhaseId,
                        status: optimisticStatus,
                        started_at: now,
                        time_in_phase_minutes: carryOverMinutes,
                        delay_reason: delayReason || t.delay_reason,
                        ...(isLastPhase ? { completed_at: now } : {})
                    }
                    : t
            ))

            // Close old history entry with time_spent_minutes
            if (oldPhaseId) {
                setHistory(prev => prev.map(h => {
                    if (h.action_id === taskId && h.exited_at === null) {
                        // Calculate time spent ONLY for this session
                        let timeSpent = 0
                        setTasks(currentTasks => {
                            const task = currentTasks.find(t => t.id === taskId)
                            if (task?.started_at) {
                                const elapsed = Math.floor((Date.now() - new Date(task.started_at).getTime()) / 60000)
                                timeSpent = elapsed
                            }
                            return currentTasks // No change
                        })
                        return { ...h, exited_at: now, time_spent_minutes: timeSpent }
                    }
                    return h
                }))
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
                campaignId,
                delayReason,
                restartPhase
            )

            console.log('[Hook] Server response for task move:', {
                taskId: updatedTask.id,
                time_in_phase_minutes: updatedTask.time_in_phase_minutes,
                started_at: updatedTask.started_at,
                phase_id: updatedTask.phase_id,
                restartPhase
            })

            // Update with server response to ensure accuracy
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))

            return updatedTask
        } catch (err) {
            console.error('[useCampaignExecution] Error moving task:', err)
            // Revert optimistic update on error
            fetchData()
            throw err
        }
    }, [campaignId, fetchData])

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
