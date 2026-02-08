// Task/Action type definitions for the marketing operations system

export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActionType =
    | 'creative_asset'
    | 'copy_review'
    | 'legal_approval'
    | 'platform_setup'
    | 'audience_targeting'
    | 'budget_allocation'
    | 'performance_review'
    | 'optimization'
    | 'reporting'
    | 'custom'

/**
 * Main task/action entity stored in marketer_actions table
 */
export interface MarketerAction {
    id: string
    campaign_id: string
    created_at: string

    // Core fields
    title: string
    description?: string
    action_type: ActionType
    status: ActionStatus
    priority: ActionPriority

    // Phase assignment
    phase_id: string | null
    phase_name?: string

    // Timing
    timestamp: string
    due_date?: string
    started_at?: string
    completed_at?: string
    time_in_phase_minutes?: number

    // Assignment
    assignee?: string

    // Metadata
    tags?: string[]
    notes?: string

    // Estimated effort
    estimated_hours?: number
    actual_hours?: number
}

/**
 * For creating new tasks - omit auto-generated fields
 */
export type MarketerActionInsert = Omit<MarketerAction,
    'id' | 'created_at' | 'started_at' | 'completed_at' | 'time_in_phase_minutes'
> & {
    id?: string
}

/**
 * History entry for task movement between phases
 */
export interface TaskPhaseHistory {
    id: string
    action_id: string
    phase_id: string
    phase_name: string
    entered_at: string
    exited_at: string | null
    time_spent_minutes: number | null
    created_at: string
}

/**
 * For inserting history entries
 */
export type TaskPhaseHistoryInsert = Omit<TaskPhaseHistory, 'id' | 'created_at' | 'time_spent_minutes'>
