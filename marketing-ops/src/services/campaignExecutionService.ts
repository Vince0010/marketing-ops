// Service for campaign execution API calls and SSE real-time updates

import type { ExecutionPhase } from '@/types/phase'
import type { MarketerAction, MarketerActionInsert, TaskPhaseHistory } from '@/types/actions'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface CampaignExecutionData {
    phases: ExecutionPhase[]
    tasks: MarketerAction[]
    history: TaskPhaseHistory[]
}

/**
 * Campaign Execution Service
 * Handles API calls and SSE subscriptions for real-time updates
 */
export const campaignExecutionService = {
    /**
     * Fetch all execution data for a campaign
     */
    async fetchCampaignData(campaignId: string): Promise<CampaignExecutionData> {
        const response = await fetch(`${API_URL}/campaigns/${campaignId}/execution`)

        if (!response.ok) {
            throw new Error(`Failed to fetch campaign data: ${response.statusText}`)
        }

        return response.json()
    },

    /**
     * Create a new task
     */
    async createTask(taskData: MarketerActionInsert): Promise<MarketerAction> {
        const response = await fetch(`${API_URL}/campaigns/${taskData.campaign_id}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        })

        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.statusText}`)
        }

        return response.json()
    },

    /**
     * Update a task
     */
    async updateTask(
        taskId: string,
        updates: Partial<MarketerAction>,
        campaignId: string
    ): Promise<MarketerAction> {
        const response = await fetch(`${API_URL}/campaigns/${campaignId}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        })

        if (!response.ok) {
            throw new Error(`Failed to update task: ${response.statusText}`)
        }

        return response.json()
    },

    /**
     * Move a task to a different phase
     */
    async moveTaskToPhase(
        taskId: string,
        newPhaseId: string | null,
        phase: ExecutionPhase | null,
        oldPhaseId: string | null,
        isLastPhase: boolean,
        campaignId: string,
        delayReason?: string
    ): Promise<MarketerAction> {
        const response = await fetch(`${API_URL}/campaigns/${campaignId}/tasks/${taskId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPhaseId, oldPhaseId, phase, isLastPhase, delayReason })
        })

        if (!response.ok) {
            throw new Error(`Failed to move task: ${response.statusText}`)
        }

        return response.json()
    },

    /**
     * Delete a task
     */
    async deleteTask(taskId: string, campaignId: string): Promise<void> {
        const response = await fetch(`${API_URL}/campaigns/${campaignId}/tasks/${taskId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.statusText}`)
        }
    },

    /**
     * Setup real-time subscription via SSE
     * Returns cleanup function
     */
    setupRealtimeSubscription(
        campaignId: string,
        onUpdate: (event: string, data: any) => void
    ): () => void {
        console.log('[CampaignExecutionService] Setting up SSE for campaign:', campaignId)

        const eventSource = new EventSource(`${API_URL}/events/${campaignId}`)

        eventSource.onopen = () => {
            console.log('[CampaignExecutionService] SSE connected')
        }

        eventSource.onerror = (error) => {
            console.error('[CampaignExecutionService] SSE error:', error)
        }

        // Listen to all task events
        const events = ['task-created', 'task-updated', 'task-moved', 'task-deleted', 'history-update', 'task-update']

        events.forEach(event => {
            eventSource.addEventListener(event, (e: MessageEvent) => {
                console.log(`[CampaignExecutionService] Received ${event}:`, e.data)
                try {
                    const data = JSON.parse(e.data)
                    onUpdate(event, data)
                } catch (err) {
                    console.error('[CampaignExecutionService] Error parsing SSE data:', err)
                }
            })
        })

        // Return cleanup function
        return () => {
            console.log('[CampaignExecutionService] Closing SSE connection')
            eventSource.close()
        }
    }
}
