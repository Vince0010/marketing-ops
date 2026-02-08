import type {
  Campaign as CampaignRow,
  CampaignInsert,
} from './campaign'
import type {
  ExecutionPhase as ExecutionPhaseRow,
  ExecutionPhaseInsert,
  DriftEvent as DriftEventRow,
} from './phase'

export type DriftEvent = DriftEventRow

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

export interface OverrideEvent {
  id: string
  campaign_id: string
  recommendation_id?: string // Link to the AI recommendation that was overridden
  created_at: string
  override_type: 'ai_recommendation' | 'gate_decision' | 'timeline' | 'budget' | 'resource'
  original_recommendation: 'proceed' | 'adjust' | 'pause'
  user_action: 'proceed' | 'adjust' | 'pause'
  reason: string
  system_confidence?: number
  risk_score_at_time?: number
  outcome?: 'success' | 'failure' | 'partial_success'
  outcome_explanation?: string
  lesson_learned?: string
  system_was_correct?: boolean
  overridden_by?: string
  reviewed_at?: string
  reviewer_notes?: string
}

export interface CampaignTemplate {
  id: string
  created_at: string
  name: string
  description: string
  source_campaign_id?: string
  source_campaign_name?: string
  success_metrics?: string
  default_phases?: Record<string, unknown>
  recommended_timeline_days?: number
  suitable_campaign_types?: string[]
  suitable_industries?: string[]
  times_used?: number
  success_rate?: number
  key_success_factors?: string[]
  created_by?: string
  is_public?: boolean
  status?: 'active' | 'archived' | 'draft'
  last_used_at?: string
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

export interface TeamCapacity {
  id: string
  created_at: string
  updated_at: string
  team_member_id: string
  campaign_id: string
  phase_id?: string
  allocated_hours: number
  week_starting: string
  actual_hours?: number
  utilization_percentage?: number
  allocation_status?: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  campaigns?: { id: string; name: string } // For join data
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

export interface ABTestSuggestion {
  test_type: string
  hypothesis: string
  control_variant: string
  test_variant: string
  setup_instructions: string[]
  success_criteria: string
  recommended_duration_days: number
  expected_impact: string
  confidence_level: number
}

export interface StrategicFailure {
  id: string
  campaign_id: string
  created_at: string
  detected_date: string
  detection_criteria: string
  primary_diagnosis: 'creative_fatigue' | 'audience_mismatch' | 'timing_issues' | 'value_proposition' | 'budget_constraints' | 'technical_issues' | 'market_saturation' | 'competition'
  diagnosis_confidence: number
  creative_hypothesis_score?: number
  targeting_hypothesis_score?: number
  timing_hypothesis_score?: number
  value_prop_hypothesis_score?: number
  evidence_points?: string[]
  performance_data?: Record<string, unknown>
  ai_analysis?: string
  ai_model_used?: string
  ai_generated_at?: string
  recommended_actions?: string[]
  ab_test_suggestions?: ABTestSuggestion[]
  resolution_actions?: string[]
  resolved?: boolean
  resolution_date?: string
  post_resolution_performance?: Record<string, unknown>
  lesson_learned?: string
  prevention_strategies?: string[]
  analyzed_by?: string
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
      override_events: {
        Row: OverrideEvent
        Insert: Omit<OverrideEvent, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<OverrideEvent, 'id' | 'created_at'>> & Record<string, unknown>
      }
      campaign_templates: {
        Row: CampaignTemplate
        Insert: Omit<CampaignTemplate, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<CampaignTemplate, 'id' | 'created_at'>> & Record<string, unknown>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<TeamMember, 'id' | 'created_at'>> & Record<string, unknown>
      }
      team_capacity: {
        Row: TeamCapacity
        Insert: Omit<TeamCapacity, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>
        Update: Partial<Omit<TeamCapacity, 'id' | 'created_at' | 'updated_at'>> & Record<string, unknown>
      }
      performance_metrics: {
        Row: PerformanceMetric
        Insert: Omit<PerformanceMetric, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<PerformanceMetric, 'id' | 'created_at'>> & Record<string, unknown>
      }
      strategic_failures: {
        Row: StrategicFailure
        Insert: Omit<StrategicFailure, 'id' | 'created_at'> & Record<string, unknown>
        Update: Partial<Omit<StrategicFailure, 'id' | 'created_at'>> & Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
