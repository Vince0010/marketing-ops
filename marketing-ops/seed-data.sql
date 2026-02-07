-- Seed Data for Marketing Ops Tracking System Demo
-- Run this after creating the database schema

-- ============================================================================
-- 1. TEAM MEMBERS
-- ============================================================================
INSERT INTO team_members (name, email, role, department, weekly_capacity_hours, skill_tags, status) VALUES
('Sarah Chen', 'sarah.chen@agency.com', 'Senior Strategist', 'strategy', 40.0, ARRAY['strategy', 'research', 'analytics'], 'active'),
('Mike Rodriguez', 'mike.rodriguez@agency.com', 'Creative Director', 'creative', 40.0, ARRAY['creative', 'design', 'video'], 'active'),
('Emily Johnson', 'emily.johnson@agency.com', 'Account Manager', 'account', 40.0, ARRAY['client_management', 'project_management'], 'active'),
('David Kim', 'david.kim@agency.com', 'Media Specialist', 'media', 40.0, ARRAY['media_buying', 'meta_ads', 'google_ads'], 'active'),
('Lisa Wang', 'lisa.wang@agency.com', 'Analytics Lead', 'analytics', 40.0, ARRAY['analytics', 'reporting', 'data_analysis'], 'active');

-- ============================================================================
-- 2. DEMO CAMPAIGNS
-- ============================================================================

-- Campaign 1: Successful Campaign (Benchmark)
INSERT INTO campaigns (
  name, campaign_type, status, description, industry, 
  start_date, end_date, total_budget, daily_budget,
  primary_objective, primary_kpi, target_value,
  target_audience, creative_strategy, 
  meta_pixel_id, meta_ads_account_id,
  operational_health, performance_health, 
  drift_count, positive_drift_count, negative_drift_count
) VALUES (
  'Spring Fashion Collection Launch', 'seasonal_promo', 'completed', 
  'Launch campaign for spring 2026 fashion collection targeting young professionals',
  'Fashion & Retail', '2026-01-15', '2026-02-15', 50000.00, 1500.00,
  'sales', 'ROAS', 4.5,
  '{"age_range": "25-35", "gender": "all", "interests": ["fashion", "lifestyle"], "location": "urban"}',
  '{"formats": ["static_images", "video"], "theme": "spring_refresh", "cta": "shop_now"}',
  'FB_PIXEL_123456', 'AD_ACCOUNT_789012',
  95, 88, 2, 1, 1
);

-- Campaign 2: Positive Drift Success (Template Creation Example) 
INSERT INTO campaigns (
  name, campaign_type, status, description, industry,
  start_date, end_date, total_budget, daily_budget,
  primary_objective, primary_kpi, target_value,
  target_audience, creative_strategy,
  meta_pixel_id, meta_ads_account_id,
  operational_health, performance_health,
  drift_count, positive_drift_count, negative_drift_count
) VALUES (
  'Q4 Holiday Tech Bundle', 'seasonal_promo', 'completed',
  'Holiday campaign for tech bundle targeting early tech adopters',
  'Technology', '2025-11-01', '2025-12-15', 75000.00, 2000.00,
  'sales', 'ROAS', 5.0,
  '{"age_range": "25-45", "gender": "all", "interests": ["technology", "gadgets"], "behavior": "early_adopters"}',
  '{"formats": ["video", "carousel"], "theme": "innovation_bundle", "cta": "learn_more"}',
  'FB_PIXEL_456789', 'AD_ACCOUNT_123456',
  98, 92, 3, 2, 1
);

-- Campaign 3: In Progress (for testing tracker)
INSERT INTO campaigns (
  name, campaign_type, status, description, industry,
  start_date, end_date, total_budget, daily_budget,
  primary_objective, primary_kpi, target_value,
  target_audience, creative_strategy,
  meta_pixel_id, meta_ads_account_id,
  operational_health, performance_health,
  drift_count, positive_drift_count, negative_drift_count
) VALUES (
  'Summer Fitness Challenge', 'lead_gen', 'in_progress',
  'Lead generation campaign for summer fitness program',
  'Health & Wellness', '2026-02-01', '2026-03-15', 35000.00, 1000.00,
  'lead_gen', 'CPL', 15.00,
  '{"age_range": "25-40", "gender": "all", "interests": ["fitness", "health"], "location": "suburban"}',
  '{"formats": ["video", "static_images"], "theme": "summer_challenge", "cta": "sign_up"}',
  'FB_PIXEL_789012', 'AD_ACCOUNT_345678',
  85, 75, 1, 0, 1
);

-- Get campaign IDs for phases (Note: Replace with actual UUIDs after campaigns are created)
-- You'll need to run SELECT id, name FROM campaigns; and update the UUIDs below

-- ============================================================================
-- 3. EXECUTION PHASES (using placeholder campaign IDs - update after campaigns are inserted)
-- ============================================================================

-- For Campaign 1: Spring Fashion (Completed - shows success pattern)
-- Replace 'CAMPAIGN_1_ID' with actual UUID from campaigns table
/*
INSERT INTO execution_phases (
  campaign_id, phase_number, phase_name, phase_type,
  planned_start_date, planned_end_date, planned_duration_days,
  actual_start_date, actual_end_date, actual_duration_days,
  status, drift_days, drift_type,
  owner, activities
) VALUES 
-- Phase 1: Planning
('CAMPAIGN_1_ID', 1, 'Strategy & Planning', 'planning',
 '2026-01-15', '2026-01-18', 3,
 '2026-01-15', '2026-01-18', 3,
 'completed', 0, 'neutral',
 'Sarah Chen', ARRAY['audience research', 'competitive analysis', 'KPI setting']),

-- Phase 2: Creative (positive drift - completed early)
('CAMPAIGN_1_ID', 2, 'Creative Development', 'creative',
 '2026-01-19', '2026-01-25', 6,
 '2026-01-19', '2026-01-23', 4,
 'completed', -2, 'positive',
 'Mike Rodriguez', ARRAY['design concepts', 'video production', 'copywriting']),

-- Phase 3: Compliance (on time)
('CAMPAIGN_1_ID', 3, 'Compliance & Approval', 'compliance',
 '2026-01-26', '2026-01-28', 2,
 '2026-01-26', '2026-01-28', 2,
 'completed', 0, 'neutral',
 'Emily Johnson', ARRAY['legal review', 'client approval']),

-- Phase 4: Setup (negative drift)
('CAMPAIGN_1_ID', 4, 'Campaign Setup', 'setup',
 '2026-01-29', '2026-02-01', 3,
 '2026-01-29', '2026-02-03', 4,
 'completed', 1, 'negative',
 'David Kim', ARRAY['pixel setup', 'audience creation', 'campaign structure']),

-- Phase 5: Launch (on time)
('CAMPAIGN_1_ID', 5, 'Launch & Monitoring', 'launch',
 '2026-02-02', '2026-02-04', 2,
 '2026-02-04', '2026-02-06', 2,
 'completed', 0, 'neutral',
 'Emily Johnson', ARRAY['campaign launch', 'initial monitoring']),

-- Phase 6: Optimization (on time)
('CAMPAIGN_1_ID', 6, 'Optimization', 'optimization',
 '2026-02-05', '2026-02-12', 7,
 '2026-02-05', '2026-02-12', 7,
 'completed', 0, 'neutral',
 'David Kim', ARRAY['A/B testing', 'budget optimization', 'audience refinement']),

-- Phase 7: Reporting
('CAMPAIGN_1_ID', 7, 'Final Reporting', 'reporting',
 '2026-02-13', '2026-02-15', 2,
 '2026-02-13', '2026-02-15', 2,
 'completed', 0, 'neutral',
 'Lisa Wang', ARRAY['performance analysis', 'final report']);
*/

-- ============================================================================
-- 4. DRIFT EVENTS (examples from completed campaigns)
-- ============================================================================

-- Note: Insert these after you have actual campaign and phase IDs

-- ============================================================================
-- 5. STAKEHOLDER ACTIONS (Accountability Examples)
-- ============================================================================

-- Note: Insert these after you have actual campaign IDs

-- ============================================================================
-- 6. CAMPAIGN TEMPLATES (Success Patterns)
-- ============================================================================

INSERT INTO campaign_templates (
  name, description, template_type, 
  success_metrics, default_phases,
  recommended_timeline_days, suitable_campaign_types,
  key_success_factors, created_by, status
) VALUES (
  'Fashion Launch Template', 
  'Proven template for seasonal fashion campaigns based on Q1 2026 success',
  'success_pattern',
  'Achieved 4.8 ROAS, 15% lower CPA than industry average, completed 2 days early',
  '[
    {"phase_name": "Strategy & Planning", "phase_type": "planning", "planned_duration_days": 3},
    {"phase_name": "Creative Development", "phase_type": "creative", "planned_duration_days": 5},
    {"phase_name": "Compliance & Approval", "phase_type": "compliance", "planned_duration_days": 2},
    {"phase_name": "Campaign Setup", "phase_type": "setup", "planned_duration_days": 3},
    {"phase_name": "Launch & Monitoring", "phase_type": "launch", "planned_duration_days": 2},
    {"phase_name": "Optimization", "phase_type": "optimization", "planned_duration_days": 7},
    {"phase_name": "Final Reporting", "phase_type": "reporting", "planned_duration_days": 2}
  ]',
  24, ARRAY['seasonal_promo', 'new_product_launch'],
  ARRAY['Early creative completion', 'Strong client relationship', 'Pre-approved brand guidelines'],
  'Sarah Chen', 'active'
);

-- ============================================================================
-- 7. PERFORMANCE METRICS (Sample Data)
-- ============================================================================

-- Note: Insert performance metrics after getting actual campaign IDs

-- ============================================================================
-- INSTRUCTIONS FOR COMPLETING SEED DATA
-- ============================================================================

/*
To complete the seed data:

1. Run this initial seed script
2. Run: SELECT id, name FROM campaigns ORDER BY name;
3. Copy the UUIDs for each campaign
4. Replace the placeholder campaign IDs in the commented sections above
5. Uncomment and run the execution phases, drift events, and other related data
6. Update the campaign_templates.source_campaign_id with actual campaign UUIDs

This provides:
- 3 demo campaigns (completed, completed with positive drift, in progress)
- 5 team members for capacity planning
- 1 proven template for reuse
- Foundation for all the execution tracker features

The "Summer Fitness Challenge" campaign is in_progress status so you can test:
- Phase completion and drift creation
- Real-time drift event tracking
- Accountability timeline (add stakeholder actions)
- Performance metrics integration
*/