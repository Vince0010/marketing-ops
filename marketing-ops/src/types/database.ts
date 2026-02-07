import type {
  Campaign as CampaignRow,
  CampaignInsert,
} from './campaign'
import type {
  ExecutionPhase as ExecutionPhaseRow,
  ExecutionPhaseInsert,
  DriftEvent as DriftEventRow,
} from './phase'

// Additional database table types
export interface RiskScore {
  id: string
  campaign_id: string
  created_at: string
  overall_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  timeline_risk?: number
  budget_risk?: number
  resource_risk?: number
  performance_risk?: number
  compliance_risk?: number
  risk_factors?: string[]
  mitigation_suggestions?: string[]
  gate_recommendation: 'proceed' | 'adjust' | 'pause'
  gate_reason?: string
  calculated_by?: string
  calculated_at?: string
}

export interface Recommendation {
  id: string
  campaign_id: string
  created_at: string
  tier: 'immediate' | 'tactical' | 'strategic'
  category?: string
  title: string
  description: string
  implementation_steps?: string[]
  estimated_effort?: string
  estimated_impact?: string
  confidence_score?: number
  status?: 'suggested' | 'accepted' | 'rejected' | 'deferred' | 'completed'
  accepted_at?: string
  completed_at?: string
  rejected_reason?: string
  implementation_notes?: string
  outcome_feedback?: string
  effectiveness_rating?: number
  generated_by?: string
  ai_model?: string
  ai_confidence?: number
  assigned_to?: string
  due_date?: string
}

export interface StakeholderAction {
  id: string
  campaign_id: string
  phase_id?: string
  created_at: string
  action_type: string
  action_description: string
  stakeholder_name: string
  stakeholder_role: string
  stakeholder_type: 'client' | 'agency' | 'external'
  requested_date: string
  expected_date?: string
  actual_date?: string
  overdue_days?: number
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'blocked'
  delay_reason?: string
  delay_attribution?: 'client' | 'agency' | 'external' | 'force_majeure'
  delay_impact?: string
  critical_path?: boolean
  notes?: string
  logged_by?: string
  logged_at?: string
}

export interface TeamMember {
  id: string
  created_at: string
  name: string
  email?: string
  role: string
  department?: string
  weekly_capacity_hours?: number
  hourly_rate?: number
  skill_tags?: string[]
  status?: 'active' | 'inactive' | 'on_leave'
  start_date?: string
  preferred_campaign_types?: string[]
  max_concurrent_campaigns?: number
}

export interface PerformanceMetric {
  id: string
  campaign_id: string
  created_at: string
  metric_date: string
  metric_source: string
  impressions?: number
  clicks?: number
  conversions?: number
  spend?: number
  revenue?: number
  ctr?: number
  cpc?: number
  cpa?: number
  roas?: number
  conversion_rate?: number
  reach?: number
  frequency?: number
  cpm?: number
  video_views?: number
  video_completion_rate?: number
  brand_awareness_lift?: number
  google_trends_score?: number
  tiktok_hashtag_volume?: number
  youtube_search_volume?: number
  branded_search_lift?: number
  likes?: number
  shares?: number
  comments?: number
  engagement_rate?: number
  custom_metrics?: Record<string, unknown>
  data_source_id?: string
  is_estimated?: boolean
  confidence_level?: number
}

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
      risk_scores: {
        Row: RiskScore
        Insert: Omit<RiskScore, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<RiskScore, 'id' | 'created_at'>> & Record<string, unknown>
      }
      recommendations: {
        Row: Recommendation
        Insert: Omit<Recommendation, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<Recommendation, 'id' | 'created_at'>> & Record<string, unknown>
      }
      stakeholder_actions: {
        Row: StakeholderAction
        Insert: Omit<StakeholderAction, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<StakeholderAction, 'id' | 'created_at'>> & Record<string, unknown>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<TeamMember, 'id' | 'created_at'>> & Record<string, unknown>
      }
      performance_metrics: {
        Row: PerformanceMetric
        Insert: Omit<PerformanceMetric, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<PerformanceMetric, 'id' | 'created_at'>> & Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
