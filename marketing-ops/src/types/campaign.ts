export type CampaignStatus = 'planning' | 'validated' | 'in_progress' | 'completed' | 'paused'

export type CampaignType = 
  | 'new_product_launch'
  | 'seasonal_promo'
  | 'brand_awareness'
  | 'lead_gen'
  | 'retargeting'
  | 'event_based'

export type PrimaryObjective = 
  | 'sales'
  | 'lead_gen'
  | 'brand_awareness'
  | 'engagement'
  | 'traffic'
  | 'app_installs'
  | 'store_visits'

export type PrimaryKPI = 
  | 'ROAS'
  | 'CPA'
  | 'CPL'
  | 'CTR'
  | 'engagement_rate'
  | 'reach'
  | 'video_views'

export interface Campaign {
  id: string
  created_at: string
  
  // Identity
  name: string
  campaign_type: CampaignType
  status: CampaignStatus
  
  // Timeline
  start_date: string
  end_date: string
  actual_launch_date?: string
  actual_completion_date?: string
  
  // Budget
  total_budget: number
  daily_budget?: number
  
  // Objectives
  primary_objective: PrimaryObjective
  primary_kpi: PrimaryKPI
  target_value: number
  secondary_kpis?: string[]
  
  // Audience
  target_audience?: TargetAudience
  audience_type?: string[]
  
  // Creative
  creative_strategy?: CreativeStrategy
  
  // Tracking
  meta_pixel_id?: string
  meta_ads_account_id?: string
  
  // Risk & Validation
  risk_score?: number
  gate_decision?: 'proceed' | 'adjust' | 'pause'
  gate_overridden?: boolean
  override_reason?: string
  
  // Health
  operational_health: number
  performance_health: number
  drift_count: number
  positive_drift_count: number
  negative_drift_count: number
}

export interface TargetAudience {
  demographics?: {
    age_range?: string[]
    gender?: 'male' | 'female' | 'all'
    location_type?: string
    locations?: string[]
    income_level?: string
  }
  psychographics?: {
    interests?: string[]
    behaviors?: string[]
    life_events?: string[]
  }
}

export interface CreativeStrategy {
  format?: string[]
  theme?: string
  message?: string
  cta?: string
  testing_plan?: string[]
}

export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'operational_health' | 'performance_health' | 'drift_count' | 'positive_drift_count' | 'negative_drift_count'>
