// Default phase types with autocomplete support
export const DEFAULT_PHASE_TYPES = [
  'planning', 'creative', 'compliance', 'setup', 'launch', 'optimization', 'reporting'
] as const

export type DefaultPhaseType = typeof DEFAULT_PHASE_TYPES[number]

// Accepts default types with autocomplete + any custom string
export type PhaseType = DefaultPhaseType | (string & {})

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type DriftType = 'positive' | 'negative' | 'neutral'

// Working state for the stage builder (before saving to DB)
export interface StageConfig {
  tempId: string
  phase_number: number
  phase_name: string
  phase_type: PhaseType
  planned_duration_days: number
  owner: string
  activities: string[]
  deliverables: string[]
  approvers: string[]
  dependencies: string[] // phase_number references as strings
}

export interface ExecutionPhase {
  id: string
  campaign_id: string
  created_at: string

  // Phase Identity
  phase_number: number
  phase_name: string
  phase_type: PhaseType

  // Timeline
  planned_start_date: string
  planned_end_date: string
  planned_duration_days: number
  
  // DEPRECATED: Use task_phase_history for time tracking and drift calculation
  // These fields remain for backward compatibility but should not be used in new code
  actual_start_date?: string
  actual_end_date?: string
  actual_duration_days?: number

  // DEPRECATED: Phases don't have statuses - tasks do
  // Phase "status" should be derived from task states, not stored
  status: PhaseStatus

  // DEPRECATED: Use calculatePhaseAggregateMetrics for drift calculation
  // Drift should be calculated from aggregated task times, not stored
  drift_days: number
  drift_type?: DriftType
  drift_reason?: string

  // Ownership
  owner?: string
  dependencies?: string[]
  blockers?: string[]

  // Details
  activities?: string[]
  deliverables?: string[]
  approvers?: string[]
}

// For inserting phases into Supabase (omit auto-generated fields)
export type ExecutionPhaseInsert = Omit<ExecutionPhase,
  'id' | 'created_at' | 'actual_start_date' | 'actual_end_date' | 'actual_duration_days' | 'drift_days' | 'drift_type' | 'drift_reason'
>

export interface DriftEvent {
  id: string
  campaign_id: string
  phase_id: string
  created_at: string

  drift_type: DriftType
  drift_days: number

  phase_name: string
  planned_duration: number
  actual_duration: number

  root_cause?: string
  attribution?: string

  impact_on_timeline?: string
  lesson_learned?: string
  actionable_insight?: string
  template_worthy: boolean
}
