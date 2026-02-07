export const CAMPAIGN_TYPES = [
  { value: 'new_product_launch', label: 'New Product Launch' },
  { value: 'seasonal_promo', label: 'Seasonal Promotion' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'lead_gen', label: 'Lead Generation' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'event_based', label: 'Event-Based' },
]

export const CAMPAIGN_OBJECTIVES = [
  { value: 'sales', label: 'Sales (Direct Revenue)' },
  { value: 'lead_gen', label: 'Lead Generation' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'app_installs', label: 'App Installs' },
  { value: 'store_visits', label: 'Store Visits' },
]

export const PRIMARY_KPIS = [
  { value: 'ROAS', label: 'ROAS (Return on Ad Spend)' },
  { value: 'CPA', label: 'CPA (Cost Per Acquisition)' },
  { value: 'CPL', label: 'CPL (Cost Per Lead)' },
  { value: 'CTR', label: 'CTR (Click-Through Rate)' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'reach', label: 'Reach' },
  { value: 'video_views', label: 'Video Views' },
]

export const CAMPAIGN_STATUS = {
  PLANNING: 'planning',
  VALIDATED: 'validated',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
}

export const RISK_LEVELS = {
  LOW: { color: 'green', label: 'Low Risk', min: 70 },
  MEDIUM: { color: 'yellow', label: 'Medium Risk', min: 50 },
  HIGH: { color: 'orange', label: 'High Risk', min: 30 },
  CRITICAL: { color: 'red', label: 'Critical Risk', min: 0 },
}

export const RECOMMENDATION_TIERS = {
  IMMEDIATE: 'immediate',
  TACTICAL: 'tactical',
  STRATEGIC: 'strategic',
}