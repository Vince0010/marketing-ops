// Default phase types with autocomplete support
export const DEFAULT_PHASE_TYPES = [
  'planning', 'creative', 'compliance', 'setup', 'launch', 'optimization', 'reporting'
] as const

export type DefaultPhaseType = typeof DEFAULT_PHASE_TYPES[number]

// Accepts default types with autocomplete + any custom string
export type PhaseType = DefaultPhaseType | (string & {})

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type DriftType = 'positive' | 'negative' | 'neutral'

// Ticket/card inside a stage (Notion-like)
export interface StageTicket {
  id: string
  title: string
  description?: string
}

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
  tickets?: StageTicket[]
}

// Task/ticket on an execution phase (tracker board)
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface PhaseTicket {
  id: string
  title: string
  description?: string
  assignee?: string
  due_date?: string
  priority?: TicketPriority
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
  actual_start_date?: string
  actual_end_date?: string
  actual_duration_days?: number

  // Status
  status: PhaseStatus

  // Drift
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
  /** Tasks/tickets in this phase (tracker board; persisted in simulate) */
  tickets?: PhaseTicket[]
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
