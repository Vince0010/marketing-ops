// Task/Action type definitions for the marketing operations system

export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'

// ActionType is flexible - workflows are user-defined per campaign
// Common examples provided as defaults in UI, but any string is valid
export type ActionType = string

// Completion timing for phase transitions
export type CompletionTiming = 'early' | 'on_time' | 'late'

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

    // Delay tracking
    delay_reason?: string

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
    completion_timing?: CompletionTiming
    created_at: string
}

/**
 * For inserting history entries
 */
export type TaskPhaseHistoryInsert = Omit<TaskPhaseHistory, 'id' | 'created_at' | 'time_spent_minutes'>

