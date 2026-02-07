export type PhaseType = 
  | 'planning'
  | 'creative'
  | 'compliance'
  | 'setup'
  | 'launch'
  | 'optimization'
  | 'reporting'

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type DriftType = 'positive' | 'negative' | 'neutral'

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
}

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
