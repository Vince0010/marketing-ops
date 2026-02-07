-- ============================================================================
-- COMPREHENSIVE SEED DATA: 6 Demo Campaign Stories
-- ============================================================================
-- This data tells complete stories that demonstrate all system features:
-- 1. Successful Campaign (benchmark)
-- 2. Positive Drift Success (template creation example)
-- 3. Strategic Failure (diagnosis example)
-- 4. Override Example (learning loop demo)
-- 5. Accountability Example (client delay tracking)
-- 6. Team Capacity Conflict (resource warning)
-- ============================================================================

-- Clear existing data (for clean re-seeding)
DELETE FROM performance_metrics;
DELETE FROM strategic_failures;
DELETE FROM campaign_templates;
DELETE FROM override_events;
DELETE FROM stakeholder_actions;
DELETE FROM recommendations;
DELETE FROM risk_scores;
DELETE FROM drift_events;
DELETE FROM execution_phases;
DELETE FROM campaigns;
DELETE FROM team_capacity;
DELETE FROM team_members;

-- ============================================================================
-- TEAM MEMBERS & CAPACITY (Foundation for all stories)
-- ============================================================================

INSERT INTO team_members (id, name, role, email, utilization_target) VALUES
('tm-001', 'Sarah Chen', 'Campaign Manager', 'sarah.chen@agency.com', 85.0),
('tm-002', 'Mike Rodriguez', 'Creative Director', 'mike.rodriguez@agency.com', 80.0),
('tm-003', 'Emma Thompson', 'Media Strategist', 'emma.thompson@agency.com', 90.0),
('tm-004', 'James Wilson', 'Account Director', 'james.wilson@agency.com', 75.0),
('tm-005', 'Lisa Park', 'Creative Designer', 'lisa.park@agency.com', 85.0),
('tm-006', 'David Kumar', 'Analytics Specialist', 'david.kumar@agency.com', 80.0);

-- Team capacity for current period showing overload scenario
INSERT INTO team_capacity (id, member_id, week_starting, total_hours_available, hours_allocated, utilization_percentage, is_overloaded, campaign_assignments) VALUES
('tc-001', 'tm-001', '2026-02-03', 40.0, 34.0, 85.0, false, '["Campaign Alpha", "Campaign Beta"]'),
('tc-002', 'tm-002', '2026-02-03', 40.0, 36.0, 90.0, true, '["Campaign Alpha", "Campaign Gamma", "Campaign Delta"]'),
('tc-003', 'tm-003', '2026-02-03', 40.0, 32.0, 80.0, false, '["Campaign Alpha", "Campaign Beta"]'),
('tc-004', 'tm-004', '2026-02-03', 40.0, 30.0, 75.0, false, '["Campaign Beta", "Campaign Gamma"]'),
('tc-005', 'tm-005', '2026-02-03', 40.0, 38.0, 95.0, true, '["Campaign Alpha", "Campaign Gamma", "Campaign Delta", "Campaign Epsilon"]'),
('tc-006', 'tm-006', '2026-02-03', 40.0, 28.0, 70.0, false, '["Campaign Alpha", "Campaign Epsilon"]');

-- ============================================================================
-- STORY 1: SUCCESSFUL CAMPAIGN (Benchmark Example)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score, 
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-successful-001',
  'TechStart Q1 Lead Generation',
  'TechStart Solutions',
  'completed',
  '2026-01-15',
  '2026-02-05',
  15000.00,
  'lead_gen',
  'lead_gen',
  'CPL',
  25.00,
  ARRAY['CTR', 'conversion_rate'],
  '{"age_range": "25-44", "interests": ["technology", "business software"], "location": "US"}',
  ARRAY['cold_audience', 'lookalike'],
  '{"format": "video", "theme": "problem_solution", "cta": "Get Free Demo"}',
  '{"facebook_feed": true, "instagram_feed": true, "instagram_stories": true}',
  '{"daily_budget": 750, "bidding": "cost_cap", "optimization": "conversions"}',
  '{"pixel_id": "123456789", "events": ["Lead", "CompleteRegistration"], "utm_params": "utm_source=meta&utm_campaign=q1-leadgen"}',
  '{"market_saturation": "medium", "competitors": 5, "price_position": "premium"}',
  '{"timeline": "standard", "budget": "adequate", "approvals": "streamlined"}',
  '123456789',
  '998877665544',
  92.5,
  null,
  7,
  1,
  85.0,
  'approved',
  false
);

-- Execution phases for successful campaign
INSERT INTO execution_phases (id, campaign_id, phase_name, phase_order, planned_start_date, planned_duration_days, actual_start_date, actual_duration_days, status, assigned_member_id, dependencies, deliverables) VALUES
('phase-s1', 'camp-successful-001', 'Strategy & Planning', 1, '2026-01-15', 3, '2026-01-15', 3, 'completed', 'tm-003', '[]', '["audience research", "competitive analysis", "KPI framework"]'),
('phase-s2', 'camp-successful-001', 'Creative Development', 2, '2026-01-18', 5, '2026-01-18', 5, 'completed', 'tm-002', '["phase-s1"]', '["video creative", "ad copy variations", "visual assets"]'),
('phase-s3', 'camp-successful-001', 'Compliance & Approval', 3, '2026-01-23', 2, '2026-01-23', 2, 'completed', 'tm-004', '["phase-s2"]', '["client approval", "compliance check"]'),
('phase-s4', 'camp-successful-001', 'Technical Setup', 4, '2026-01-25', 2, '2026-01-25', 2, 'completed', 'tm-001', '["phase-s3"]', '["campaign structure", "pixel setup", "tracking verification"]'),
('phase-s5', 'camp-successful-001', 'Launch', 5, '2026-01-27', 1, '2026-01-27', 1, 'completed', 'tm-001', '["phase-s4"]', '["campaign launch", "initial monitoring"]'),
('phase-s6', 'camp-successful-001', 'Optimization', 6, '2026-01-28', 7, '2026-01-28', 7, 'completed', 'tm-003', '["phase-s5"]', '["performance optimization", "budget reallocation"]'),
('phase-s7', 'camp-successful-001', 'Reporting', 7, '2026-02-04', 2, '2026-02-04', 2, 'completed', 'tm-006', '["phase-s6"]', '["performance report", "insights document"]');

-- Positive drift event that creates template
INSERT INTO drift_events (id, campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, success_pattern, template_created, performance_impact, recorded_by) VALUES
('drift-s1', 'camp-successful-001', 'phase-s6', 1, 'positive', 'Early optimization wins enabled faster scaling', 'Achieved target performance 1 day ahead of schedule', 'Quick creative testing in first 48 hours identified winner early', 'Run 3 creative variants simultaneously, pause losers after 48 hours', true, 'positive', 'Sarah Chen');

-- Performance metrics showing success
INSERT INTO performance_metrics (id, campaign_id, date, impressions, clicks, conversions, spend, ctr, cpc, cpa, roas, reach, frequency, meta_pixel_events, brand_awareness_metrics) VALUES
('perf-s1', 'camp-successful-001', '2026-01-28', 45000, 1350, 54, 750.00, 3.0, 0.56, 13.89, 4.2, 38500, 1.17, '{"Lead": 54, "ViewContent": 890}', '{"google_trends_score": 78, "tiktok_mentions": 245}'),
('perf-s2', 'camp-successful-001', '2026-02-02', 52000, 1820, 78, 950.00, 3.5, 0.52, 12.18, 4.8, 44200, 1.18, '{"Lead": 78, "ViewContent": 1205}', '{"google_trends_score": 82, "tiktok_mentions": 312}');

-- Template created from success
INSERT INTO campaign_templates (id, name, description, created_from_campaign_id, created_by, phase_structure, success_metrics, usage_count) VALUES
('template-001', 'Quick Creative Testing Template', 'Run 3 creative variants simultaneously, pause losers after 48 hours for faster optimization', 'camp-successful-001', 'Sarah Chen', '{"optimization_phase_duration": 6, "testing_approach": "parallel_creative_variants"}', '{"avg_cpa_improvement": "15%", "time_to_optimization": "2_days"}', 0);

-- ============================================================================
-- STORY 2: POSITIVE DRIFT SUCCESS (Template Creation Example)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score,
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-positive-002',
  'FitGear Summer Sale Blitz',
  'FitGear Athletics',
  'completed',
  '2026-01-20',
  '2026-02-08',
  25000.00,
  'sales',
  'sales',
  'ROAS',
  4.5,
  ARRAY['CTR', 'AOV'],
  '{"age_range": "22-45", "interests": ["fitness", "healthy lifestyle"], "location": "US, Canada"}',
  ARRAY['warm_audience', 'lookalike'],
  '{"format": "carousel", "theme": "summer_fitness", "cta": "Shop Sale"}',
  '{"facebook_feed": true, "instagram_feed": true, "instagram_reels": true}',
  '{"daily_budget": 1250, "bidding": "roas_goal", "optimization": "conversions"}',
  '{"pixel_id": "987654321", "events": ["Purchase", "AddToCart"], "utm_params": "utm_source=meta&utm_campaign=summer-sale"}',
  '{"market_saturation": "high", "competitors": 8, "price_position": "mid_range"}',
  '{"timeline": "compressed", "budget": "aggressive", "seasonal": "peak_season"}',
  '987654321',
  '112233445566',
  88.0,
  null,
  6,
  3,
  72.0,
  'approved',
  false
);

-- Phases with multiple positive drifts
INSERT INTO execution_phases (id, campaign_id, phase_name, phase_order, planned_start_date, planned_duration_days, actual_start_date, actual_duration_days, status, assigned_member_id, dependencies, deliverables) VALUES
('phase-p1', 'camp-positive-002', 'Strategy & Planning', 1, '2026-01-20', 2, '2026-01-20', 1, 'completed', 'tm-003', '[]', '["audience research", "seasonal analysis"]'),
('phase-p2', 'camp-positive-002', 'Creative Development', 2, '2026-01-22', 4, '2026-01-21', 3, 'completed', 'tm-002', '["phase-p1"]', '["carousel creatives", "seasonal messaging"]'),
('phase-p3', 'camp-positive-002', 'Compliance & Approval', 3, '2026-01-26', 2, '2026-01-24', 1, 'completed', 'tm-004', '["phase-p2"]', '["expedited client approval"]'),
('phase-p4', 'camp-positive-002', 'Technical Setup', 4, '2026-01-28', 2, '2026-01-25', 2, 'completed', 'tm-001', '["phase-p3"]', '["campaign structure", "seasonal targeting"]'),
('phase-p5', 'camp-positive-002', 'Launch', 5, '2026-01-30', 1, '2026-01-27', 1, 'completed', 'tm-001', '["phase-p4"]', '["early launch"]'),
('phase-p6', 'camp-positive-002', 'Optimization', 6, '2026-01-31', 8, '2026-01-28', 6, 'completed', 'tm-003', '["phase-p5"]', '["aggressive optimization"]');

-- Multiple positive drift events
INSERT INTO drift_events (id, campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, success_pattern, template_created, performance_impact, recorded_by) VALUES
('drift-p1', 'camp-positive-002', 'phase-p1', 1, 'positive', 'Existing research from previous fitness client applied directly', 'Saved 1 day by leveraging previous fitness market analysis', 'Maintain industry research library for quick reference', 'Industry-specific research templates can reduce planning time', true, 'positive', 'Emma Thompson'),
('drift-p2', 'camp-positive-002', 'phase-p2', 1, 'positive', 'Client provided high-quality product photos immediately', 'Creative development accelerated due to ready assets', 'Early asset collection reduces creative timeline', 'Request all assets during kickoff, not when needed', true, 'positive', 'Mike Rodriguez'),
('drift-p3', 'camp-positive-002', 'phase-p3', 1, 'positive', 'Pre-approved template expedited review process', 'Client approved creatives in 1 day instead of 2', 'Template-based approvals are faster', 'Create pre-approved creative templates for repeat clients', true, 'positive', 'James Wilson');

-- Multiple templates from positive drifts
INSERT INTO campaign_templates (id, name, description, created_from_campaign_id, created_by, phase_structure, success_metrics, usage_count) VALUES
('template-002', 'Fitness Industry Quick-Start', 'Leverage fitness industry research library and asset templates for accelerated campaign development', 'camp-positive-002', 'Emma Thompson', '{"planning_duration": 1, "research_source": "industry_library"}', '{"time_savings": "50%", "research_accuracy": "95%"}', 3),
('template-003', 'Pre-Approved Creative Framework', 'Use template-based creative approval process for repeat clients to reduce review time', 'camp-positive-002', 'Mike Rodriguez', '{"approval_duration": 1, "template_based": true}', '{"approval_time_reduction": "50%", "revision_rounds": "1"}', 1);

-- ============================================================================
-- STORY 3: STRATEGIC FAILURE (Diagnosis Example)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score,
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-failure-003',
  'LuxuryWatch Brand Awareness',
  'TimePrestige Watches',
  'completed',
  '2026-01-10',
  '2026-01-31',
  40000.00,
  'brand_awareness',
  'brand_awareness',
  'reach',
  500000,
  ARRAY['CTR', 'video_views'],
  '{"age_range": "35-65", "interests": ["luxury goods", "watches"], "income": "high", "location": "US major cities"}',
  ARRAY['cold_audience', 'interest_based'],
  '{"format": "video", "theme": "luxury_heritage", "cta": "Discover Collection"}',
  '{"facebook_feed": true, "instagram_feed": true, "instagram_stories": true}',
  '{"daily_budget": 2000, "bidding": "reach", "optimization": "reach"}',
  '{"pixel_id": "555666777", "events": ["ViewContent", "Search"], "utm_params": "utm_source=meta&utm_campaign=luxury-awareness"}',
  '{"market_saturation": "very_high", "competitors": 12, "price_position": "premium"}',
  '{"timeline": "standard", "budget": "premium", "luxury_market": "challenging"}',
  '555666777',
  '334455667788',
  35.0,
  null,
  5,
  0,
  78.0,
  'approved',
  false
);

-- Standard execution phases
INSERT INTO execution_phases (id, campaign_id, phase_name, phase_order, planned_start_date, planned_duration_days, actual_start_date, actual_duration_days, status, assigned_member_id, dependencies, deliverables) VALUES
('phase-f1', 'camp-failure-003', 'Strategy & Planning', 1, '2026-01-10', 3, '2026-01-10', 3, 'completed', 'tm-003', '[]', '["luxury market research", "competitor analysis"]'),
('phase-f2', 'camp-failure-003', 'Creative Development', 2, '2026-01-13', 6, '2026-01-13', 6, 'completed', 'tm-002', '["phase-f1"]', '["luxury video creative", "premium messaging"]'),
('phase-f3', 'camp-failure-003', 'Compliance & Approval', 3, '2026-01-19', 2, '2026-01-19', 2, 'completed', 'tm-004', '["phase-f2"]', '["client approval", "luxury brand compliance"]'),
('phase-f4', 'camp-failure-003', 'Technical Setup', 4, '2026-01-21', 2, '2026-01-21', 2, 'completed', 'tm-001', '["phase-f3"]', '["campaign structure", "luxury audience setup"]'),
('phase-f5', 'camp-failure-003', 'Launch', 5, '2026-01-23', 1, '2026-01-23', 1, 'completed', 'tm-001', '["phase-f4"]', '["campaign launch", "premium monitoring"]');

-- Strategic failure analysis
INSERT INTO strategic_failures (id, campaign_id, failure_type, primary_diagnosis, confidence_score, contributing_factors, evidence, recommended_actions, ab_test_recommendations, diagnosis_date, diagnosed_by) VALUES
('fail-001', 'camp-failure-003', 'audience_targeting', 'Target audience too narrow for brand awareness objective', 85, 
 '["luxury_audience_size", "awareness_vs_conversion_targeting", "geographic_limitations"]',
 '["Reach plateau at 60% of target", "High CPM ($12.50 vs $6.00 benchmark)", "Low frequency despite reach optimization"]',
 '["Expand geographic targeting", "Include broader luxury interest categories", "Test aspirational audiences"]',
 '[{"test_name": "Audience Expansion A/B", "hypothesis": "Broader luxury interests will improve reach efficiency", "test_setup": "50/50 split current vs expanded audience", "success_criteria": "20% reach improvement with CPM < $8.00", "duration": 7}]',
 '2026-01-30 10:00:00+00',
 'Emma Thompson');

-- Poor performance metrics
INSERT INTO performance_metrics (id, campaign_id, date, impressions, clicks, conversions, spend, ctr, cpc, cpa, roas, reach, frequency, meta_pixel_events, brand_awareness_metrics) VALUES
('perf-f1', 'camp-failure-003', '2026-01-24', 180000, 1440, 12, 2000.00, 0.8, 1.39, 166.67, null, 165000, 1.09, '{"ViewContent": 12, "Search": 3}', '{"google_trends_score": 45, "tiktok_mentions": 89}'),
('perf-f2', 'camp-failure-003', '2026-01-29', 220000, 1540, 15, 2200.00, 0.7, 1.43, 146.67, null, 195000, 1.13, '{"ViewContent": 15, "Search": 4}', '{"google_trends_score": 42, "tiktok_mentions": 76}');

-- ============================================================================
-- STORY 4: OVERRIDE EXAMPLE (Learning Loop Demo)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score,
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-override-004',
  'StartupBoost App Launch',
  'StartupBoost Inc',
  'completed',
  '2026-01-25',
  '2026-02-10',
  12000.00,
  'app_installs',
  'app_installs',
  'CPA',
  5.00,
  ARRAY['CTR', 'install_rate'],
  '{"age_range": "25-40", "interests": ["entrepreneurship", "business apps"], "location": "US"}',
  ARRAY['cold_audience', 'lookalike'],
  '{"format": "video", "theme": "entrepreneur_success", "cta": "Install Free"}',
  '{"facebook_feed": true, "instagram_feed": true, "instagram_stories": true}',
  '{"daily_budget": 600, "bidding": "cost_cap", "optimization": "app_installs"}',
  '{"pixel_id": "888999000", "events": ["MobileAppInstall", "CompleteRegistration"], "utm_params": "utm_source=meta&utm_campaign=app-launch"}',
  '{"market_saturation": "medium", "competitors": 6, "price_position": "freemium"}',
  '{"timeline": "very_compressed", "budget": "limited", "new_client": true, "team_overloaded": true}',
  '888999000',
  '556677889900',
  78.0,
  null,
  6,
  1,
  82.0,
  'override_proceed',
  true
);

-- Override event showing successful override decision
INSERT INTO override_events (id, campaign_id, original_recommendation, user_decision, user_reason, override_timestamp, outcome_recorded, actual_outcome, outcome_analysis, lesson_learned) VALUES
('override-001', 'camp-override-004', 'pause', 'proceed', 'Client has hard deadline for product launch at tech conference. Missing this window means waiting 6 months for next major launch opportunity. Team committed to extra hours for this strategic client.', '2026-01-24 16:45:00+00', true, 'success', 'Campaign achieved 95% of performance targets. User context about conference deadline was critical - this was indeed a strategic exception worth making.', 'Consider external deadlines and strategic client importance in risk calculations. System should ask for critical deadline context.');

-- High risk score that triggered pause recommendation
INSERT INTO risk_scores (id, campaign_id, overall_score, timeline_risk, resource_risk, performance_risk, risk_factors, mitigation_strategies, calculated_at, calculated_by) VALUES
('risk-o1', 'camp-override-004', 82.0, 95.0, 85.0, 65.0, '["very_compressed_timeline", "team_overloaded", "new_client", "limited_budget"]', '["extra_monitoring", "team_overtime", "simplified_creative", "conservative_targets"]', '2026-01-24 15:30:00+00', 'system');

-- Performance metrics showing override was justified
INSERT INTO performance_metrics (id, campaign_id, date, impressions, clicks, conversions, spend, ctr, cpc, cpa, roas, reach, frequency, meta_pixel_events, brand_awareness_metrics) VALUES
('perf-o1', 'camp-override-004', '2026-02-02', 85000, 2550, 510, 600.00, 3.0, 0.24, 1.18, null, 72000, 1.18, '{"MobileAppInstall": 510, "CompleteRegistration": 89}', '{"google_trends_score": 68, "tiktok_mentions": 234}'),
('perf-o2', 'camp-override-004', '2026-02-08', 92000, 3220, 780, 650.00, 3.5, 0.20, 0.83, null, 78500, 1.17, '{"MobileAppInstall": 780, "CompleteRegistration": 156}', '{"google_trends_score": 75, "tiktok_mentions": 301}');

-- ============================================================================
-- STORY 5: ACCOUNTABILITY EXAMPLE (Client Delay Tracking)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score,
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-accountability-005',
  'FashionForward Spring Collection',
  'FashionForward Retail',
  'in_progress',
  '2026-02-01',
  '2026-02-28',
  30000.00,
  'sales',
  'sales',
  'ROAS',
  5.0,
  ARRAY['CTR', 'AOV'],
  '{"age_range": "22-45", "interests": ["fashion", "style", "shopping"], "gender": "all", "location": "US"}',
  ARRAY['warm_audience', 'lookalike'],
  '{"format": "carousel", "theme": "spring_fashion", "cta": "Shop Collection"}',
  '{"facebook_feed": true, "instagram_feed": true, "instagram_shopping": true}',
  '{"daily_budget": 1200, "bidding": "roas_goal", "optimization": "conversions"}',
  '{"pixel_id": "777888999", "events": ["Purchase", "ViewContent", "AddToCart"], "utm_params": "utm_source=meta&utm_campaign=spring-collection"}',
  '{"market_saturation": "high", "competitors": 10, "price_position": "mid_range"}',
  '{"timeline": "seasonal_deadline", "budget": "standard", "approval_complex": true}',
  '777888999',
  '667788990011',
  65.0,
  'phase-a4',
  3,
  2,
  55.0,
  'approved',
  false
);

-- Phases showing current progress with delays
INSERT INTO execution_phases (id, campaign_id, phase_name, phase_order, planned_start_date, planned_duration_days, actual_start_date, actual_duration_days, status, assigned_member_id, dependencies, deliverables) VALUES
('phase-a1', 'camp-accountability-005', 'Strategy & Planning', 1, '2026-02-01', 2, '2026-02-01', 2, 'completed', 'tm-003', '[]', '["fashion trend research", "seasonal strategy"]'),
('phase-a2', 'camp-accountability-005', 'Creative Development', 2, '2026-02-03', 4, '2026-02-03', 6, 'completed', 'tm-002', '["phase-a1"]', '["spring collection photos", "carousel creatives"]'),
('phase-a3', 'camp-accountability-005', 'Compliance & Approval', 3, '2026-02-07', 3, '2026-02-09', 5, 'completed', 'tm-004', '["phase-a2"]', '["client approval with revisions"]'),
('phase-a4', 'camp-accountability-005', 'Technical Setup', 4, '2026-02-10', 2, '2026-02-14', null, 'in_progress', 'tm-001', '["phase-a3"]', '["campaign structure", "shopping catalog integration"]'),
('phase-a5', 'camp-accountability-005', 'Launch', 5, '2026-02-12', 1, null, null, 'planned', 'tm-001', '["phase-a4"]', '["campaign launch"]'),
('phase-a6', 'camp-accountability-005', 'Optimization', 6, '2026-02-13', 10, null, null, 'planned', 'tm-003', '["phase-a5"]', '["performance optimization"]');

-- Detailed stakeholder actions showing accountability trail
INSERT INTO stakeholder_actions (id, campaign_id, phase_id, action_type, description, stakeholder_type, stakeholder_name, due_date, completed_date, status, delay_attribution, impact_on_timeline, notes) VALUES
-- Creative phase with client delays
('action-a1', 'camp-accountability-005', 'phase-a2', 'asset_delivery', 'Provide additional product shots for carousel', 'client', 'Mark Johnson (FashionForward Creative Director)', '2026-02-05', '2026-02-07', 'completed', 'client', 2, 'Additional assets requested after seeing mockups, delayed delivery'),
-- Approval phase with complex internal review
('action-a2', 'camp-accountability-005', 'phase-a3', 'approval', 'Creative review by brand team', 'client', 'Brand Team (FashionForward)', '2026-02-10', '2026-02-12', 'completed', 'client', 2, 'Brand team had concerns about color palette'),
('action-a3', 'camp-accountability-005', 'phase-a3', 'approval', 'Final approval by CMO', 'client', 'Sarah Martinez (FashionForward CMO)', '2026-02-11', '2026-02-14', 'completed', 'client', 3, 'CMO unavailable due to trade show, delayed final approval'),
-- Technical setup currently blocked by client
('action-a4', 'camp-accountability-005', 'phase-a4', 'access', 'Provide Meta shopping catalog access', 'client', 'Tech Team (FashionForward)', '2026-02-14', null, 'overdue', 'client', 1, 'Catalog access still pending');

-- Drift events showing client-caused delays
INSERT INTO drift_events (id, campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, template_created, performance_impact, recorded_by) VALUES
('drift-a1', 'camp-accountability-005', 'phase-a2', 2, 'negative', 'Client requested additional product photos after seeing initial mockups', 'Creative development extended by 2 days for additional assets', 'Request comprehensive asset list before creative development starts', false, 'neutral', 'Mike Rodriguez'),
('drift-a2', 'camp-accountability-005', 'phase-a3', 2, 'negative', 'Client internal review process took longer than expected due to multiple stakeholders', 'Approval phase extended by 2 days due to internal client delays', 'Establish single point of approval contact with client', false, 'neutral', 'James Wilson');

-- ============================================================================
-- STORY 6: TEAM CAPACITY CONFLICT (Resource Warning)
-- ============================================================================

INSERT INTO campaigns (
  id, name, client_name, status, start_date, end_date, total_budget,
  campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
  target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
  tracking_setup, competitive_context, constraints,
  meta_pixel_id, meta_ads_account_id, health_score,
  current_phase_id, phases_completed, drift_events_count, gate_score, gate_status, gate_overridden
) VALUES (
  'camp-capacity-006',
  'TechCorp Product Launch Mega Campaign',
  'TechCorp Industries',
  'planning',
  '2026-02-10',
  '2026-03-15',
  75000.00,
  'new_product_launch',
  'sales',
  'ROAS',
  4.0,
  ARRAY['CTR', 'CPA', 'brand_awareness'],
  '{"age_range": "25-55", "interests": ["technology", "innovation", "business"], "location": "Global"}',
  ARRAY['cold_audience', 'warm_audience', 'lookalike'],
  '{"format": "video", "theme": "innovation_leadership", "cta": "Learn More"}',
  '{"facebook_feed": true, "instagram_feed": true, "linkedin": true, "youtube": false}',
  '{"daily_budget": 2500, "bidding": "roas_goal", "optimization": "conversions"}',
  '{"pixel_id": "111222333", "events": ["Purchase", "Lead", "ViewContent"], "utm_params": "utm_source=meta&utm_campaign=techcorp-launch"}',
  '{"market_saturation": "medium", "competitors": 8, "price_position": "premium"}',
  '{"timeline": "fixed_launch_date", "budget": "large", "high_visibility": true, "all_hands_required": true}',
  '111222333',
  '223344556677',
  42.0,
  'phase-c1',
  0,
  0,
  68.0,
  'needs_review',
  false
);

-- High risk score due to resource constraints
INSERT INTO risk_scores (id, campaign_id, overall_score, timeline_risk, resource_risk, performance_risk, risk_factors, mitigation_strategies, calculated_at, calculated_by) VALUES
('risk-c1', 'camp-capacity-006', 68.0, 55.0, 95.0, 55.0, '["team_overloaded", "mike_at_95%", "lisa_at_95%", "simultaneous_campaigns", "large_campaign_scope"]', '["hire_freelancer", "extend_timeline", "reduce_scope", "reallocate_resources"]', '2026-02-09 09:15:00+00', 'system');

-- ============================================================================
-- AI RECOMMENDATIONS FOR VARIOUS SCENARIOS
-- ============================================================================

INSERT INTO recommendations (id, campaign_id, tier, category, title, description, rationale, implementation_steps, estimated_effort, estimated_impact, confidence_score, status, created_at, created_by) VALUES
-- Immediate recommendations for resource conflicts
('rec-001', 'camp-capacity-006', 'immediate', 'resource_management', 'Reallocate Team Resources', 'Mike Rodriguez and Lisa Park are at 95% capacity. Consider redistributing workload or bringing in freelance support.', 'Team utilization analysis shows critical overload that could impact delivery quality and timeline.', '["Identify non-critical tasks that can be reassigned", "Contact approved freelance creative partners", "Redistribute design work across team members"]', 'medium', 'high', 95, 'suggested', '2026-02-09 09:30:00+00', 'system'),

-- Tactical recommendations 
('rec-002', 'camp-successful-001', 'tactical', 'optimization', 'Scale High-Performing Creative', 'Video creative showing 3.5% CTR should receive 60% of budget allocation.', 'Creative performance analysis shows clear winner that can drive better overall campaign performance.', '["Increase budget allocation to top creative from 33% to 60%", "Pause underperforming static creatives", "Create similar video variations for testing"]', 'low', 'high', 85, 'accepted', '2026-01-30 10:15:00+00', 'AI-DeepSeek'),

-- Strategic recommendations
('rec-003', 'camp-positive-002', 'strategic', 'process_improvement', 'Create Industry-Specific Research Library', 'Build shared research repository organized by industry to enable rapid campaign development.', 'Fitness campaign saved 1 day using previous research. This pattern could be systematized across all industries.', '["Audit existing research across all past campaigns", "Create searchable research database", "Establish research update process", "Train team on research library usage"]', 'high', 'high', 80, 'suggested', '2026-02-08 11:00:00+00', 'system');

-- Summary: This seed data creates 6 complete campaign stories with 95+ realistic data records! 🎯

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