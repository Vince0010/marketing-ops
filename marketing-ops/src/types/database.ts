import type {
  Campaign as CampaignRow,
  CampaignInsert,
} from './campaign'
import type {
  ExecutionPhase as ExecutionPhaseRow,
  ExecutionPhaseInsert,
  DriftEvent as DriftEventRow,
} from './phase'

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: CampaignRow
        Insert: CampaignInsert & Record<string, unknown>
        Update: Partial<CampaignInsert> & Record<string, unknown>
      }
      execution_phases: {
        Row: ExecutionPhaseRow
        Insert: ExecutionPhaseInsert & Record<string, unknown>
        Update: Partial<ExecutionPhaseInsert> & Record<string, unknown>
      }
      drift_events: {
        Row: DriftEventRow
        Insert: Omit<DriftEventRow, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<DriftEventRow, 'id' | 'created_at'>> & Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
