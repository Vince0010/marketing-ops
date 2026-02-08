-- Marketing Ops Tracking System - Database Schema
-- Phase 1: Core Tables for Full Functionality
--
-- USAGE: Run this entire file in the Supabase SQL Editor.
-- It will drop all existing tables and recreate them from scratch.
-- Then run seed-data.sql to populate with demo data.

-- ============================================================================
-- DROP EXISTING TABLES (clean slate)
-- ============================================================================
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS strategic_failures CASCADE;
DROP TABLE IF EXISTS campaign_templates CASCADE;
DROP TABLE IF EXISTS override_events CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS stakeholder_actions CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS drift_events CASCADE;
DROP TABLE IF EXISTS execution_phases CASCADE;
DROP TABLE IF EXISTS team_capacity CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- ============================================================================
-- 1. CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campaign Identity
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN (
    'new_product_launch', 'seasonal_promo', 'brand_awareness', 
    'lead_gen', 'retargeting', 'event_based'
  )),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning', 'validated', 'in_progress', 'completed', 'paused'
  )),
  description TEXT,
  industry TEXT,
  
  -- Timeline & Budget
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget DECIMAL(10,2) NOT NULL,
  daily_budget DECIMAL(10,2),
  
  -- Objectives & KPIs
  primary_objective TEXT NOT NULL CHECK (primary_objective IN (
    'sales', 'lead_gen', 'brand_awareness', 'engagement', 
    'traffic', 'app_installs', 'store_visits'
  )),
  primary_kpi TEXT NOT NULL CHECK (primary_kpi IN (
    'ROAS', 'CPA', 'CPL', 'CTR', 'engagement_rate', 'reach', 'video_views'
  )),
  target_value DECIMAL(10,2) NOT NULL,
  secondary_kpis TEXT[], -- Array of secondary KPI names
  
  -- Complex JSON fields for detailed configurations
  target_audience JSONB DEFAULT '{}',
  audience_type TEXT[] DEFAULT ARRAY[]::TEXT[],
  creative_strategy JSONB DEFAULT '{}',
  channel_placement JSONB DEFAULT '{}',
  budget_strategy JSONB DEFAULT '{}',
  tracking_setup JSONB DEFAULT '{}',
  competitive_context JSONB DEFAULT '{}',
  constraints JSONB DEFAULT '{}',
  
  -- Meta Ads Integration
  meta_pixel_id TEXT,
  meta_ads_account_id TEXT,
  
  -- Health Indicators
  operational_health INTEGER DEFAULT 100 CHECK (operational_health >= 0 AND operational_health <= 100),
  performance_health INTEGER DEFAULT 100 CHECK (performance_health >= 0 AND performance_health <= 100),
  drift_count INTEGER DEFAULT 0,
  positive_drift_count INTEGER DEFAULT 0,
  negative_drift_count INTEGER DEFAULT 0,
  
  -- Risk & Override Tracking
  risk_score INTEGER,
  gate_status TEXT CHECK (gate_status IN ('proceed', 'adjust', 'pause')),
  gate_overridden BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  
  -- Computed/Derived Fields
  actual_start_date DATE,
  actual_end_date DATE,
  final_cost DECIMAL(10,2)
);

-- ============================================================================
-- 2. EXECUTION PHASES TABLE  
-- ============================================================================
CREATE TABLE execution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Phase Identity
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  phase_type TEXT NOT NULL, -- Flexible: allows default types + custom
  
  -- Timeline
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  planned_duration_days INTEGER NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  actual_duration_days INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'blocked'
  )),
  
  -- Drift Analysis
  drift_days INTEGER DEFAULT 0,
  drift_type TEXT CHECK (drift_type IN ('positive', 'negative', 'neutral')),
  drift_reason TEXT,
  
  -- Ownership & Dependencies
  owner TEXT,
  dependencies TEXT[], -- Array of dependency descriptions
  blockers TEXT[], -- Array of current blockers
  
  -- Details
  activities TEXT[], -- Array of activities for this phase
  deliverables TEXT[], -- Array of expected deliverables
  approvers TEXT[], -- Array of people who need to approve
  
  -- Unique constraint to prevent duplicate phase numbers per campaign
  UNIQUE(campaign_id, phase_number)
);

-- ============================================================================
-- 3. DRIFT EVENTS TABLE
-- ============================================================================
CREATE TABLE drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES execution_phases(id) ON DELETE CASCADE,
  
  -- Drift Details
  drift_days INTEGER NOT NULL,
  drift_type TEXT NOT NULL CHECK (drift_type IN ('positive', 'negative', 'neutral')),
  reason TEXT,
  impact_description TEXT,
  
  -- Learning & Templates
  lesson_learned TEXT,
  success_pattern TEXT, -- For positive drifts
  template_created BOOLEAN DEFAULT FALSE,
  
  -- Performance Impact
  performance_impact TEXT CHECK (performance_impact IN ('positive', 'negative', 'neutral', 'unknown')),
  cost_impact DECIMAL(10,2), -- Additional cost incurred due to drift

  -- Phase Timeline Context (denormalized for easy querying per phase)
  phase_name TEXT,
  planned_duration INTEGER,
  actual_duration INTEGER,
  root_cause TEXT,
  attribution TEXT, -- Who/what caused the drift
  impact_on_timeline TEXT,
  actionable_insight TEXT,
  template_worthy BOOLEAN DEFAULT FALSE,

  recorded_by TEXT, -- Who recorded this drift event
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. RISK SCORES TABLE
-- ============================================================================
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Overall Risk
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Risk Breakdown
  timeline_risk INTEGER CHECK (timeline_risk >= 0 AND timeline_risk <= 100),
  budget_risk INTEGER CHECK (budget_risk >= 0 AND budget_risk <= 100),
  resource_risk INTEGER CHECK (resource_risk >= 0 AND resource_risk <= 100),
  performance_risk INTEGER CHECK (performance_risk >= 0 AND performance_risk <= 100),
  compliance_risk INTEGER CHECK (compliance_risk >= 0 AND compliance_risk <= 100),
  
  -- Risk Factors
  risk_factors TEXT[], -- Array of identified risk factors
  mitigation_suggestions TEXT[], -- Array of suggested mitigations
  
  -- Decision Gate
  gate_recommendation TEXT NOT NULL CHECK (gate_recommendation IN ('proceed', 'adjust', 'pause')),
  gate_reason TEXT,
  
  calculated_by TEXT DEFAULT 'system', -- 'system' or 'manual'
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Recommendation Classification
  tier TEXT NOT NULL CHECK (tier IN ('immediate', 'tactical', 'strategic')),
  category TEXT, -- e.g., 'budget', 'targeting', 'creative', 'timeline'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Implementation Details
  implementation_steps TEXT[], -- Array of step-by-step instructions
  estimated_effort TEXT, -- 'low', 'medium', 'high'
  estimated_impact TEXT, -- 'low', 'medium', 'high'
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Tracking
  status TEXT DEFAULT 'suggested' CHECK (status IN (
    'suggested', 'accepted', 'rejected', 'deferred', 'completed'
  )),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejected_reason TEXT,
  
  -- Implementation Tracking
  implementation_notes TEXT,
  outcome_feedback TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  
  -- Generation Source
  generated_by TEXT DEFAULT 'system', -- 'system', 'ai', 'manual'
  ai_model TEXT, -- e.g., 'deepseek-v2.5'
  ai_confidence DECIMAL(3,2), -- AI confidence in recommendation
  
  assigned_to TEXT,
  due_date DATE
);

-- ============================================================================
-- 6. OVERRIDE EVENTS TABLE
-- ============================================================================
CREATE TABLE override_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Override Details
  override_type TEXT NOT NULL, -- 'gate_decision', 'recommendation', 'timeline', etc.
  original_recommendation TEXT NOT NULL, -- What the system recommended
  user_action TEXT NOT NULL, -- What the user decided to do instead
  reason TEXT NOT NULL, -- User's reason for override
  
  -- Context
  system_confidence INTEGER, -- System's confidence in original recommendation
  risk_score_at_time INTEGER, -- Risk score when override happened
  
  -- Outcome Analysis (filled in post-campaign)
  outcome TEXT CHECK (outcome IN ('success', 'failure', 'mixed', 'pending')),
  outcome_explanation TEXT,
  lesson_learned TEXT,
  system_was_correct BOOLEAN, -- Learning for future recommendations
  
  -- User Info
  overridden_by TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

-- ============================================================================
-- 7. STAKEHOLDER ACTIONS TABLE (Accountability Tracking)
-- ============================================================================
CREATE TABLE stakeholder_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES execution_phases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Action Details
  action_type TEXT NOT NULL, -- 'approval', 'review', 'delivery', 'feedback', etc.
  action_description TEXT NOT NULL,
  
  -- Stakeholder Info
  stakeholder_name TEXT NOT NULL,
  stakeholder_role TEXT NOT NULL, -- 'client', 'agency', 'external', 'internal'
  stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('client', 'agency', 'external')),
  
  -- Timeline
  requested_date DATE NOT NULL,
  expected_date DATE,
  actual_date DATE,
  overdue_days INTEGER, -- Calculated field
  
  -- Status & Delays
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'overdue', 'blocked'
  )),
  delay_reason TEXT,
  delay_attribution TEXT CHECK (delay_attribution IN ('client', 'agency', 'external', 'force_majeure')),
  
  -- Impact
  delay_impact TEXT, -- Description of how delay impacts campaign
  critical_path BOOLEAN DEFAULT FALSE, -- Is this on the critical path?
  
  notes TEXT,
  logged_by TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Member Info
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL, -- 'strategist', 'creative', 'account_manager', etc.
  department TEXT, -- 'strategy', 'creative', 'media', 'account'
  
  -- Capacity Info
  weekly_capacity_hours DECIMAL(4,1) DEFAULT 40.0,
  hourly_rate DECIMAL(6,2), -- For cost calculations
  skill_tags TEXT[], -- Array of skills/specializations
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  start_date DATE,
  
  -- Preferences
  preferred_campaign_types TEXT[], -- Array of preferred campaign types
  max_concurrent_campaigns INTEGER DEFAULT 3
);

-- ============================================================================
-- 9. TEAM CAPACITY TABLE
-- ============================================================================
CREATE TABLE team_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Assignment Info
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES execution_phases(id) ON DELETE SET NULL,
  
  -- Capacity Allocation
  allocated_hours DECIMAL(5,1) NOT NULL, -- Hours allocated to this campaign/phase
  week_starting DATE NOT NULL, -- Week this allocation applies to
  
  -- Utilization Tracking
  actual_hours DECIMAL(5,1), -- Actual hours worked (filled in later)
  utilization_percentage DECIMAL(5,2), -- Calculated: allocated/total_capacity * 100
  
  -- Status
  allocation_status TEXT DEFAULT 'planned' CHECK (allocation_status IN (
    'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'
  )),
  
  notes TEXT,
  allocated_by TEXT,
  
  -- Unique constraint to prevent double-booking
  UNIQUE(team_member_id, campaign_id, week_starting)
);

-- ============================================================================
-- 10. PERFORMANCE METRICS TABLE
-- ============================================================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metric Info
  metric_date DATE NOT NULL,
  metric_source TEXT NOT NULL, -- 'meta_ads', 'google_analytics', 'manual', etc.
  
  -- Core Performance Metrics
  impressions BIGINT DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated Metrics
  ctr DECIMAL(5,3), -- Click-through rate
  cpc DECIMAL(6,2), -- Cost per click
  cpa DECIMAL(8,2), -- Cost per acquisition
  roas DECIMAL(6,2), -- Return on ad spend
  conversion_rate DECIMAL(5,3),
  
  -- Meta Ads Specific
  reach BIGINT,
  frequency DECIMAL(4,2),
  cpm DECIMAL(6,2), -- Cost per mille
  video_views INTEGER,
  video_completion_rate DECIMAL(5,3),
  
  -- Brand Awareness Metrics
  brand_awareness_lift DECIMAL(5,2), -- Percentage lift
  google_trends_score INTEGER, -- 0-100
  tiktok_hashtag_volume INTEGER,
  youtube_search_volume INTEGER,
  branded_search_lift DECIMAL(5,2),
  
  -- Engagement Metrics
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,3),
  
  -- Additional JSON for flexible metrics
  custom_metrics JSONB DEFAULT '{}',
  
  -- Data Quality
  data_source_id TEXT, -- External ID for data reconciliation
  is_estimated BOOLEAN DEFAULT FALSE,
  confidence_level DECIMAL(3,2) DEFAULT 1.00
);

-- ============================================================================
-- 11. STRATEGIC FAILURES TABLE
-- ============================================================================
CREATE TABLE strategic_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Failure Detection
  detected_date DATE NOT NULL,
  detection_criteria TEXT NOT NULL, -- How was failure identified
  
  -- Primary Diagnosis
  primary_diagnosis TEXT NOT NULL CHECK (primary_diagnosis IN (
    'creative_fatigue', 'audience_mismatch', 'timing_issues', 'value_proposition',
    'budget_constraints', 'technical_issues', 'market_saturation', 'competition'
  )),
  diagnosis_confidence DECIMAL(3,2) NOT NULL, -- AI/system confidence 0.00-1.00
  
  -- Hypothesis Ranking
  creative_hypothesis_score INTEGER CHECK (creative_hypothesis_score >= 0 AND creative_hypothesis_score <= 100),
  targeting_hypothesis_score INTEGER CHECK (targeting_hypothesis_score >= 0 AND targeting_hypothesis_score <= 100),
  timing_hypothesis_score INTEGER CHECK (timing_hypothesis_score >= 0 AND timing_hypothesis_score <= 100),
  value_prop_hypothesis_score INTEGER CHECK (value_prop_hypothesis_score >= 0 AND value_prop_hypothesis_score <= 100),
  
  -- Evidence
  evidence_points TEXT[], -- Array of evidence supporting the diagnosis
  performance_data JSONB, -- Detailed performance data at time of failure
  
  -- AI Analysis
  ai_analysis TEXT, -- Full AI diagnosis explanation
  ai_model_used TEXT, -- Which AI model provided diagnosis
  ai_generated_at TIMESTAMPTZ,
  
  -- Recommendations Generated
  recommended_actions TEXT[], -- Array of recommended actions
  ab_test_suggestions JSONB, -- Structured A/B test recommendations
  
  -- Resolution Tracking
  resolution_actions TEXT[], -- What actions were actually taken
  resolved BOOLEAN DEFAULT FALSE,
  resolution_date DATE,
  post_resolution_performance JSONB,
  
  -- Learning
  lesson_learned TEXT,
  prevention_strategies TEXT[],
  
  analyzed_by TEXT DEFAULT 'system'
);

-- ============================================================================
-- 12. CAMPAIGN TEMPLATES TABLE
-- ============================================================================
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT, -- 'success_pattern', 'industry_standard', 'custom'
  
  -- Source Campaign (for success patterns)
  source_campaign_id UUID REFERENCES campaigns(id),
  source_campaign_name TEXT,
  success_metrics TEXT, -- Description of what made original successful
  
  -- Template Structure
  default_phases JSONB NOT NULL, -- Array of phase configurations
  recommended_timeline_days INTEGER,
  typical_budget_range_min DECIMAL(10,2),
  typical_budget_range_max DECIMAL(10,2),
  
  -- Applicability
  suitable_campaign_types TEXT[], -- Which campaign types this works for
  suitable_industries TEXT[], -- Which industries this works for
  minimum_budget DECIMAL(10,2), -- Minimum budget for this template to be viable
  
  -- Performance History
  times_used INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2), -- Percentage of campaigns that succeeded using this
  avg_performance_lift DECIMAL(5,2), -- Average performance improvement
  
  -- Template Details
  key_success_factors TEXT[], -- What makes this template successful
  common_pitfalls TEXT[], -- What to watch out for
  customization_notes TEXT,
  
  -- Metadata
  created_by TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE, -- Can other teams use this?
  tags TEXT[], -- For easy filtering/searching
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
  deprecated_reason TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_campaign_type ON campaigns(campaign_type);

-- Execution Phases
CREATE INDEX idx_execution_phases_campaign_id ON execution_phases(campaign_id);
CREATE INDEX idx_execution_phases_status ON execution_phases(status);
CREATE INDEX idx_execution_phases_phase_number ON execution_phases(campaign_id, phase_number);

-- Performance Metrics
CREATE INDEX idx_performance_metrics_campaign_date ON performance_metrics(campaign_id, metric_date);
CREATE INDEX idx_performance_metrics_source ON performance_metrics(metric_source);

-- Team Capacity
CREATE INDEX idx_team_capacity_member_week ON team_capacity(team_member_id, week_starting);
CREATE INDEX idx_team_capacity_campaign ON team_capacity(campaign_id);

-- Stakeholder Actions
CREATE INDEX idx_stakeholder_actions_campaign ON stakeholder_actions(campaign_id);
CREATE INDEX idx_stakeholder_actions_status ON stakeholder_actions(status);
CREATE INDEX idx_stakeholder_actions_type ON stakeholder_actions(stakeholder_type);

-- Recommendations
CREATE INDEX idx_recommendations_campaign ON recommendations(campaign_id);
CREATE INDEX idx_recommendations_tier ON recommendations(tier);
CREATE INDEX idx_recommendations_status ON recommendations(status);

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant setup)
-- ============================================================================

-- Enable RLS on sensitive tables
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE execution_phases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment and customize as needed):
-- CREATE POLICY "Users can view their own campaigns" ON campaigns
--   FOR SELECT USING (auth.uid() = created_by::uuid);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to team_capacity table
CREATE TRIGGER update_team_capacity_updated_at 
    BEFORE UPDATE ON team_capacity 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate utilization percentage
CREATE OR REPLACE FUNCTION calculate_utilization()
RETURNS TRIGGER AS $$
DECLARE
    member_weekly_capacity DECIMAL(4,1);
BEGIN
    -- Get the team member's weekly capacity
    SELECT weekly_capacity_hours INTO member_weekly_capacity
    FROM team_members 
    WHERE id = NEW.team_member_id;
    
    -- Calculate utilization percentage
    IF member_weekly_capacity > 0 THEN
        NEW.utilization_percentage = (NEW.allocated_hours / member_weekly_capacity) * 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply utilization trigger
CREATE TRIGGER calculate_team_capacity_utilization 
    BEFORE INSERT OR UPDATE ON team_capacity 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_utilization();

-- ============================================================================
-- INITIAL DATA VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate campaign date ranges
CREATE OR REPLACE FUNCTION validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        RAISE EXCEPTION 'Campaign end date must be after start date';
    END IF;
    
    IF NEW.start_date < CURRENT_DATE - INTERVAL '1 year' THEN
        RAISE EXCEPTION 'Campaign start date cannot be more than 1 year in the past';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply date validation trigger
CREATE TRIGGER validate_campaign_dates_trigger
    BEFORE INSERT OR UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION validate_campaign_dates();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE campaigns IS 'Main campaigns table storing all campaign information and configurations';
COMMENT ON TABLE execution_phases IS 'Individual phases within campaign execution with timeline and drift tracking';
COMMENT ON TABLE drift_events IS 'Records of timeline drift events for learning and analysis';
COMMENT ON TABLE risk_scores IS 'Pre-launch risk scoring and gate decision tracking';
COMMENT ON TABLE recommendations IS 'AI and system-generated recommendations with implementation tracking';
COMMENT ON TABLE override_events IS 'Records when users override system recommendations for learning';
COMMENT ON TABLE stakeholder_actions IS 'Accountability tracking for client and agency actions';
COMMENT ON TABLE team_members IS 'Team member information and capacity settings';
COMMENT ON TABLE team_capacity IS 'Weekly capacity allocation and utilization tracking';
COMMENT ON TABLE performance_metrics IS 'Campaign performance data from various sources';
COMMENT ON TABLE strategic_failures IS 'Strategic failure analysis and AI diagnosis';
COMMENT ON TABLE campaign_templates IS 'Reusable campaign templates based on successful patterns';

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================