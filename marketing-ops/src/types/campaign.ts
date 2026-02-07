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
  description?: string
  industry?: string

  // Timeline
  start_date: string
  end_date: string
  actual_launch_date?: string
  actual_completion_date?: string

  // Budget
  total_budget: number
  daily_budget?: number
  budget_strategy?: BudgetStrategy

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

  // Channels
  channel_placement?: ChannelPlacement

  // Tracking
  tracking_setup?: TrackingSetup
  meta_pixel_id?: string
  meta_ads_account_id?: string

  // Competitive
  competitive_context?: CompetitiveContext

  // Constraints
  constraints?: Constraints

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
    education_level?: string
  }
  psychographics?: {
    interests?: string[]
    behaviors?: string[]
    life_events?: string[]
  }
  audience_size_estimate?: number
}

export interface CreativeStrategy {
  format?: string[]
  theme?: string
  message?: string
  cta?: string
  testing_plan?: string[]
}

export interface BudgetStrategy {
  lifetime_budget?: number
  testing_phase_percent?: number
  scaling_phase_percent?: number
  bidding_strategy?: 'lowest_cost' | 'cost_cap' | 'bid_cap' | 'roas_goal'
  bidding_target?: number
  expected_ctr?: number
  expected_cpc?: number
  expected_conversion_rate?: number
  expected_cpa?: number
}

export interface ChannelPlacement {
  facebook_placements?: string[]
  instagram_placements?: string[]
  automatic_placements?: boolean
  optimization_goal?: 'conversions' | 'link_clicks' | 'reach' | 'engagement' | 'video_views'
}

export interface TrackingSetup {
  conversion_events?: string[]
  google_analytics?: boolean
  utm_parameters?: string
  crm_integration?: boolean
  promo_code?: string
  brand_awareness_tracking?: string[]
}

export interface CompetitiveContext {
  market_saturation?: 'low' | 'medium' | 'high'
  competitor_count?: number
  competitive_advantage?: string
  price_position?: 'premium' | 'mid_range' | 'budget'
  seasonality?: 'peak' | 'off_peak' | 'neutral'
  market_trends?: 'growing' | 'stable' | 'declining'
  relevant_events?: string
}

export interface Constraints {
  known_constraints?: string[]
  resource_constraints?: string[]
  historical_ctr?: number
  historical_cpa?: number
  historical_roas?: number
  similar_past_campaigns?: string
}

export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'operational_health' | 'performance_health' | 'drift_count' | 'positive_drift_count' | 'negative_drift_count'>
