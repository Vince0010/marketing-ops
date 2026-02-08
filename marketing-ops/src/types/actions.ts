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

    // Phase completion tracking
    completed_phases?: string[]

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
    metadata?: Record<string, unknown>

    // Delay tracking
    delay_reason?: string

    // Estimated effort
    estimated_hours?: number
    actual_hours?: number

    // Planned timeline per stage (stored as JSONB in database)
    planned_timeline?: ActionCardPlannedTimeline
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

/**
 * Planned timeline for an action card - maps each stage/phase to its planned duration
 */
export interface ActionCardPlannedTimeline {
    [phaseId: string]: {
        phase_name: string
        planned_minutes: number
        phase_number: number
    }
}

/**
 * Drift metrics for a single action card in a specific phase
 */
export interface ActionCardPhaseDrift {
    phase_id: string
    phase_name: string
    phase_number: number
    planned_minutes: number
    actual_minutes: number
    drift_minutes: number
    drift_percentage: number
    status: 'ahead' | 'on_track' | 'behind'
}

/**
 * Complete drift analysis for an action card across all phases
 */
export interface ActionCardDriftAnalysis {
    action_id: string
    action_title: string
    platform?: string
    post_type?: string
    total_planned_minutes: number
    total_actual_minutes: number
    total_drift_minutes: number
    total_drift_percentage: number
    overall_status: 'ahead' | 'on_track' | 'behind'
    phase_drifts: ActionCardPhaseDrift[]
    current_phase_id: string | null
    current_phase_name?: string
    completed_phases_count: number
    total_phases_count: number
}

