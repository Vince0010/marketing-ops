import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import { sseService } from '../services/sseService.js'

const router = Router()

/**
 * GET /api/campaigns/:campaignId/execution
 * Fetch all execution data for a campaign
 */
router.get('/:campaignId/execution', async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params

        console.log('[API] Fetching execution data for campaign:', campaignId)

        const [phasesRes, tasksRes, historyRes] = await Promise.all([
            supabaseAdmin
                .from('execution_phases')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('phase_number'),
            supabaseAdmin
                .from('marketer_actions')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('timestamp', { ascending: false }),
            supabaseAdmin
                .from('task_phase_history')
                .select('*')
                .order('entered_at', { ascending: false }),
        ])

        if (phasesRes.error) throw phasesRes.error
        if (tasksRes.error) throw tasksRes.error
        if (historyRes.error) throw historyRes.error

        // Filter history to only include tasks from this campaign
        const campaignTaskIds = new Set(tasksRes.data?.map(t => t.id) || [])
        const filteredHistory = historyRes.data?.filter(h =>
            campaignTaskIds.has(h.action_id)
        ) || []

        console.log('[API] Execution data fetched:', {
            phases: phasesRes.data?.length || 0,
            tasks: tasksRes.data?.length || 0,
            history: filteredHistory.length
        })

        res.json({
            phases: phasesRes.data || [],
            tasks: tasksRes.data || [],
            history: filteredHistory,
        })
    } catch (error) {
        console.error('[API] Error fetching execution data:', error)
        res.status(500).json({ error: 'Failed to fetch execution data' })
    }
})

/**
 * POST /api/campaigns/:campaignId/tasks
 * Create a new task
 */
router.post('/:campaignId/tasks', async (req: Request, res: Response) => {
    try {
        const { campaignId } = req.params

        // Only include columns that exist in the database
        // This prevents 500 errors from unknown columns
        const allowedColumns = [
            'campaign_id', 'title', 'description', 'action_type', 'status',
            'timestamp', 'metadata', 'created_by', 'phase_id',
            'estimated_hours', 'started_at', 'completed_at', 'time_in_phase_minutes',
            'delay_reason', 'due_date', 'priority', 'assignee'
        ]

        const taskData: Record<string, unknown> = { campaign_id: campaignId }
        for (const key of allowedColumns) {
            if (key in req.body && req.body[key] !== undefined) {
                taskData[key] = req.body[key]
            }
        }

        // Set defaults
        if (!taskData.created_by) taskData.created_by = 'system'
        if (!taskData.timestamp) taskData.timestamp = new Date().toISOString()

        console.log('[API] Creating task:', taskData.title, 'with data:', JSON.stringify(taskData, null, 2))

        const { data, error } = await supabaseAdmin
            .from('marketer_actions')
            .insert([taskData])
            .select()
            .single()

        if (error) {
            console.error('[API] Supabase error:', error.message, error.details, error.hint)
            throw error
        }

        console.log('[API] Task created:', data.id)

        // Broadcast to SSE clients
        sseService.broadcast(campaignId, 'task-created', data)

        res.status(201).json(data)
    } catch (error) {
        console.error('[API] Error creating task:', error)
        res.status(500).json({ error: 'Failed to create task', details: (error as Error).message })
    }
})

/**
 * PATCH /api/campaigns/:campaignId/tasks/:taskId
 * Update a task
 */
router.patch('/:campaignId/tasks/:taskId', async (req: Request, res: Response) => {
    try {
        const { campaignId, taskId } = req.params
        const updates = req.body

        console.log('[API] Updating task:', taskId, updates)

        const { data, error } = await supabaseAdmin
            .from('marketer_actions')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single()

        if (error) throw error

        console.log('[API] Task updated:', data.id)

        // Broadcast to SSE clients
        sseService.broadcast(campaignId, 'task-updated', data)

        res.json(data)
    } catch (error) {
        console.error('[API] Error updating task:', error)
        res.status(500).json({ error: 'Failed to update task' })
    }
})

/**
 * POST /api/campaigns/:campaignId/tasks/:taskId/move
 * Move a task to a different phase
 */
router.post('/:campaignId/tasks/:taskId/move', async (req: Request, res: Response) => {
    try {
        const { campaignId, taskId } = req.params
        const { newPhaseId, oldPhaseId, phase, isLastPhase, delayReason } = req.body

        console.log('[API] Moving task:', {
            taskId,
            from: oldPhaseId || 'backlog',
            to: newPhaseId || 'backlog',
            hasDelayReason: !!delayReason
        })

        const now = new Date()
        const nowIso = now.toISOString()

        // Calculate completion timing for the old phase
        let completionTiming: 'early' | 'on_time' | 'late' | null = null
        if (oldPhaseId) {
            // Get the old phase details for timing calculation
            const { data: oldPhaseData } = await supabaseAdmin
                .from('execution_phases')
                .select('planned_end_date')
                .eq('id', oldPhaseId)
                .single()

            if (oldPhaseData?.planned_end_date) {
                const plannedEnd = new Date(oldPhaseData.planned_end_date)
                // Compare dates (ignoring time for day-level comparison)
                const plannedEndDay = new Date(plannedEnd.getFullYear(), plannedEnd.getMonth(), plannedEnd.getDate())
                const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

                if (nowDay < plannedEndDay) {
                    completionTiming = 'early'
                } else if (nowDay.getTime() === plannedEndDay.getTime()) {
                    completionTiming = 'on_time'
                } else {
                    completionTiming = 'late'
                }
            }
        }

        // Close previous phase history entry if exists
        if (oldPhaseId) {
            const historyUpdate: any = { exited_at: nowIso }
            if (completionTiming) {
                historyUpdate.completion_timing = completionTiming
            }

            const { error: historyUpdateError } = await supabaseAdmin
                .from('task_phase_history')
                .update(historyUpdate)
                .eq('action_id', taskId)
                .is('exited_at', null)

            if (historyUpdateError) {
                console.error('[API] Error closing history:', historyUpdateError)
            }
        }

        // Create new phase history entry
        if (newPhaseId && phase) {
            const historyEntry = {
                action_id: taskId,
                phase_id: newPhaseId,
                phase_name: phase.phase_name,
                entered_at: nowIso,
            }

            const { error: historyError } = await supabaseAdmin
                .from('task_phase_history')
                .insert([historyEntry])

            if (historyError) {
                console.error('[API] Error creating history:', historyError)
            }
        }

        // Update the task
        const updates: any = {
            phase_id: newPhaseId,
            started_at: nowIso,
            time_in_phase_minutes: 0,
        }

        // Add delay_reason if provided
        if (delayReason) {
            updates.delay_reason = delayReason
        }

        if (isLastPhase) {
            updates.status = 'completed'
            updates.completed_at = nowIso
        } else if (newPhaseId) {
            updates.status = 'in_progress'
        } else {
            updates.status = 'planned'
        }

        const { data, error } = await supabaseAdmin
            .from('marketer_actions')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single()

        if (error) throw error

        console.log('[API] Task moved successfully', {
            completionTiming,
            hasDelayReason: !!delayReason
        })

        // Broadcast to SSE clients
        sseService.broadcast(campaignId, 'task-moved', data)

        res.json(data)
    } catch (error) {
        console.error('[API] Error moving task:', error)
        res.status(500).json({ error: 'Failed to move task' })
    }
})

/**
 * DELETE /api/campaigns/:campaignId/tasks/:taskId
 * Delete a task
 */
router.delete('/:campaignId/tasks/:taskId', async (req: Request, res: Response) => {
    try {
        const { campaignId, taskId } = req.params

        console.log('[API] Deleting task:', taskId)

        const { error } = await supabaseAdmin
            .from('marketer_actions')
            .delete()
            .eq('id', taskId)

        if (error) throw error

        console.log('[API] Task deleted')

        // Broadcast to SSE clients
        sseService.broadcast(campaignId, 'task-deleted', { id: taskId })

        res.status(204).send()
    } catch (error) {
        console.error('[API] Error deleting task:', error)
        res.status(500).json({ error: 'Failed to delete task' })
    }
})

export default router
