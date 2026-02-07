export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign
        Insert: CampaignInsert
        Update: CampaignUpdate
      }
      execution_phases: {
        Row: ExecutionPhase
        Insert: ExecutionPhaseInsert
        Update: ExecutionPhaseUpdate
      }
      drift_events: {
        Row: DriftEvent
        Insert: DriftEventInsert
        Update: DriftEventUpdate
      }
    }
  }
}

// These will be expanded in campaign.ts
export type Campaign = any
export type CampaignInsert = any
export type CampaignUpdate = any
export type ExecutionPhase = any
export type ExecutionPhaseInsert = any
export type ExecutionPhaseUpdate = any
export type DriftEvent = any
export type DriftEventInsert = any
export type DriftEventUpdate = any
