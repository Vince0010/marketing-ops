import { supabase } from '@/lib/supabase'
import type { ExecutionPhase } from '@/types/phase'
import type { 
  MarketerAction,
  MarketerActionInsert,
  TaskPhaseHistoryInsert 
} from '@/types/actions'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * Centralized service for managing campaign execution data
 * Provides a single source of truth and handles all CRUD operations
 * Now uses backend API for better real-time sync
 */
class CampaignExecutionService {
  private subscribers: Map<string, Set<() => void>> = new Map()
  private sseConnections: Map<string, EventSource> = new Map()

  /**
   * Fetch all execution data for a campaign via API
   */
  async fetchCampaignData(campaignId: string) {
    console.log('[CampaignExecutionService] Fetching data via API for campaign:', campaignId)

    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/execution`)
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log('[CampaignExecutionService] Fetched:', {
        phases: data.phases.length,
        tasks: data.tasks.length,
        history: data.history.length
      })

      return {
        phases: data.phases || [],
        tasks: data.tasks || [],
        history: data.history || [],
      }
    } catch (error) {
      console.error('[CampaignExecutionService] API fetch error:', error)
      throw error
    }
  }

  /**
   * Create a new task via API
   */
  async createTask(taskData: MarketerActionInsert): Promise<MarketerAction> {
    console.log('[CampaignExecutionService] Creating task via API:', taskData.title)

    try {
      const response = await fetch(`${API_BASE}/campaigns/${taskData.campaign_id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[CampaignExecutionService] Task created via API:', data.id)
      
      // Notify local subscribers immediately
      this.notifySubscribers(taskData.campaign_id)

      return data
    } catch (error) {
      console.error('[CampaignExecutionService] API create error:', error)
      throw error
    }
  }

  /**
   * Update an existing task via API
   */
  async updateTask(
    taskId: string, 
    updates: Partial<MarketerAction>,
    campaignId: string
  ): Promise<MarketerAction> {
    console.log('[CampaignExecutionService] Updating task via API:', taskId, updates)

    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[CampaignExecutionService] Task updated via API:', data.id)
      
      // Notify local subscribers
      this.notifySubscribers(campaignId)

      return data
    } catch (error) {
      console.error('[CampaignExecutionService] API update error:', error)
      throw error
    }
  }

  /**
   * Move a task to a different phase via API
   */
  async moveTaskToPhase(
    taskId: string,
    newPhaseId: string | null,
    phase: ExecutionPhase | null,
    oldPhaseId: string | null,
    isLastPhase: boolean,
    campaignId: string
  ): Promise<MarketerAction> {
    console.log('[CampaignExecutionService] Moving task via API:', {
      taskId,
      from: oldPhaseId || 'backlog',
      to: newPhaseId || 'backlog'
    })

    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPhaseId,
          oldPhaseId,
          phase: phase ? { phase_name: phase.phase_name } : null,
          isLastPhase,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[CampaignExecutionService] Task moved via API')
      
      // Notify local subscribers
      this.notifySubscribers(campaignId)

      return data
    } catch (error) {
      console.error('[CampaignExecutionService] API move error:', error)
      throw error
    }
  }

  /**
   * Delete a task via API
   */
  async deleteTask(taskId: string, campaignId: string): Promise<void> {
    console.log('[CampaignExecutionService] Deleting task via API:', taskId)

    try {
      const response = await fetch(`${API_BASE}/campaigns/${campaignId}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      console.log('[CampaignExecutionService] Task deleted via API')
      
      // Notify local subscribers
      this.notifySubscribers(campaignId)
    } catch (error) {
      console.error('[CampaignExecutionService] API delete error:', error)
      throw error
    }
  }

  /**
   * Subscribe to changes for a campaign
   */
  subscribe(campaignId: string, callback: () => void): () => void {
    if (!this.subscribers.has(campaignId)) {
      this.subscribers.set(campaignId, new Set())
    }
    
    this.subscribers.get(campaignId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(campaignId)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscribers.delete(campaignId)
        }
      }
    }
  }

  /**
   * Notify all subscribers for a campaign
   */
  private notifySubscribers(campaignId: string): void {
    const subs = this.subscribers.get(campaignId)
    if (subs) {
      console.log('[CampaignExecutionService] Notifying', subs.size, 'subscribers')
      subs.forEach(callback => callback())
    }
  }

  /**
   * Set up SSE connection for real-time updates
   */
  setupRealtimeSubscription(campaignId: string, onUpdate: () => void) {
    console.log('[CampaignExecutionService] Setting up SSE connection for:', campaignId)

    // Close existing connection if any
    if (this.sseConnections.has(campaignId)) {
      this.sseConnections.get(campaignId)?.close()
    }

    const eventSource = new EventSource(`${API_BASE}/events/${campaignId}`)

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data)
      console.log('[CampaignExecutionService] SSE connected:', data.clientId)
    })

    eventSource.addEventListener('task-created', (event) => {
      console.log('[CampaignExecutionService] SSE: task created')
      onUpdate()
    })

    eventSource.addEventListener('task-updated', (event) => {
      console.log('[CampaignExecutionService] SSE: task updated')
      onUpdate()
    })

    eventSource.addEventListener('task-moved', (event) => {
      console.log('[CampaignExecutionService] SSE: task moved')
      onUpdate()
    })

    eventSource.addEventListener('task-deleted', (event) => {
      console.log('[CampaignExecutionService] SSE: task deleted')
      onUpdate()
    })

    eventSource.addEventListener('history-update', (event) => {
      console.log('[CampaignExecutionService] SSE: history updated')
      onUpdate()
    })

    eventSource.onerror = (error) => {
      console.error('[CampaignExecutionService] SSE error:', error)
      // Will automatically try to reconnect
    }

    this.sseConnections.set(campaignId, eventSource)

    return () => {
      console.log('[CampaignExecutionService] Cleaning up SSE connection')
      eventSource.close()
      this.sseConnections.delete(campaignId)
    }
  }
}

// Export singleton instance
export const campaignExecutionService = new CampaignExecutionService()
