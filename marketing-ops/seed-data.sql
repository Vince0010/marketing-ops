-- ============================================================================
-- SEED DATA: 6 Demo Campaign Stories
-- ============================================================================
-- Prerequisites: Run database-schema.sql first to create all tables.
-- This file only contains INSERT statements using the correct schema columns.
--
-- Stories:
-- 1. Successful Campaign (benchmark)
-- 2. Positive Drift Success (template creation)
-- 3. Strategic Failure (diagnosis example)
-- 4. Override Example (learning loop)
-- 5. Accountability Example (client delay tracking)
-- 6. Team Capacity Conflict (resource warning)
-- ============================================================================

-- Clear existing data in reverse dependency order (safely handle missing tables)
DO $cleanup$
BEGIN
  -- Clear all data from existing tables (ignore errors for missing tables)
  BEGIN
    DELETE FROM performance_metrics;
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist yet, ignore
  END;
  
  BEGIN
    DELETE FROM strategic_failures;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM campaign_templates;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM override_events;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM recommendations;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM stakeholder_actions;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM risk_scores;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM drift_events;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM execution_phases;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM team_capacity;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM campaigns;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    DELETE FROM team_members;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END $cleanup$;

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================
-- Insert team members with progressive fallback for missing columns
DO $team_insert$
BEGIN
  -- Try inserting with all columns (matches current schema)
  BEGIN
    INSERT INTO team_members (name, role, email, department, weekly_capacity_hours, skill_tags, status) VALUES
    ('Sarah Chen',      'Campaign Manager',     'sarah.chen@agency.com',      'strategy', 40.0, ARRAY['campaign_management', 'meta_ads', 'analytics'],      'active'),
    ('Mike Rodriguez',  'Creative Director',    'mike.rodriguez@agency.com',  'creative', 40.0, ARRAY['creative_direction', 'video', 'branding'],            'active'),
    ('Emma Thompson',   'Media Strategist',     'emma.thompson@agency.com',   'media',    40.0, ARRAY['media_planning', 'audience_targeting', 'optimization'],'active'),
    ('James Wilson',    'Account Director',     'james.wilson@agency.com',    'account',  40.0, ARRAY['client_relations', 'compliance', 'strategy'],          'active'),
    ('Lisa Park',       'Creative Designer',    'lisa.park@agency.com',       'creative', 40.0, ARRAY['graphic_design', 'motion_graphics', 'ui_design'],      'active'),
    ('David Kumar',     'Analytics Specialist', 'david.kumar@agency.com',     'strategy', 40.0, ARRAY['data_analysis', 'reporting', 'attribution'],           'active');
  EXCEPTION WHEN undefined_column THEN
    -- Fall back to inserting without department/weekly_capacity_hours
    BEGIN
      RAISE NOTICE 'Some columns not found, trying basic schema with skill_tags';
      INSERT INTO team_members (name, role, email, skill_tags, status) VALUES
      ('Sarah Chen',      'Campaign Manager',     'sarah.chen@agency.com',      ARRAY['campaign_management', 'meta_ads', 'analytics'],      'active'),
      ('Mike Rodriguez',  'Creative Director',    'mike.rodriguez@agency.com',  ARRAY['creative_direction', 'video', 'branding'],            'active'),
      ('Emma Thompson',   'Media Strategist',     'emma.thompson@agency.com',   ARRAY['media_planning', 'audience_targeting', 'optimization'],'active'),
      ('James Wilson',    'Account Director',     'james.wilson@agency.com',    ARRAY['client_relations', 'compliance', 'strategy'],          'active'),
      ('Lisa Park',       'Creative Designer',    'lisa.park@agency.com',       ARRAY['graphic_design', 'motion_graphics', 'ui_design'],      'active'),
      ('David Kumar',     'Analytics Specialist', 'david.kumar@agency.com',     ARRAY['data_analysis', 'reporting', 'attribution'],           'active');
    EXCEPTION WHEN undefined_column THEN
      -- Further fall back to minimal columns only
      BEGIN
        RAISE NOTICE 'Advanced columns not found, using minimal schema';
        INSERT INTO team_members (name, role, email, status) VALUES
        ('Sarah Chen',      'Campaign Manager',     'sarah.chen@agency.com',      'active'),
        ('Mike Rodriguez',  'Creative Director',    'mike.rodriguez@agency.com',  'active'),
        ('Emma Thompson',   'Media Strategist',     'emma.thompson@agency.com',   'active'),
        ('James Wilson',    'Account Director',     'james.wilson@agency.com',    'active'),
        ('Lisa Park',       'Creative Designer',    'lisa.park@agency.com',       'active'),
        ('David Kumar',     'Analytics Specialist', 'david.kumar@agency.com',     'active');
      EXCEPTION WHEN undefined_column THEN
        -- Final fall back to absolutely minimal columns
        RAISE NOTICE 'Using absolutely minimal schema - name and role only';
        INSERT INTO team_members (name, role) VALUES
        ('Sarah Chen',      'Campaign Manager'),
        ('Mike Rodriguez',  'Creative Director'),
        ('Emma Thompson',   'Media Strategist'),
        ('James Wilson',    'Account Director'),
        ('Lisa Park',       'Creative Designer'),
        ('David Kumar',     'Analytics Specialist');
      END;
    END;
  END;
END $team_insert$;

-- ============================================================================
-- MAIN DO BLOCK: Insert all stories with proper UUID handling
-- ============================================================================
DO $$
DECLARE
  -- Team member IDs
  sarah_id  UUID;
  mike_id   UUID;
  emma_id   UUID;
  james_id  UUID;
  lisa_id   UUID;
  david_id  UUID;
  -- Campaign IDs
  camp1_id  UUID; -- Successful
  camp2_id  UUID; -- Positive Drift
  camp3_id  UUID; -- Strategic Failure
  camp4_id  UUID; -- Override Example
  camp5_id  UUID; -- Accountability
  camp6_id  UUID; -- Team Capacity Conflict
  -- Phase IDs (reusable)
  p_id      UUID;
  p1_id UUID; p2_id UUID; p3_id UUID; p4_id UUID; p5_id UUID; p6_id UUID; p7_id UUID;
BEGIN
  -- ========================================
  -- Get team member UUIDs
  -- ========================================
  SELECT id INTO sarah_id  FROM team_members WHERE name = 'Sarah Chen';
  SELECT id INTO mike_id   FROM team_members WHERE name = 'Mike Rodriguez';
  SELECT id INTO emma_id   FROM team_members WHERE name = 'Emma Thompson';
  SELECT id INTO james_id  FROM team_members WHERE name = 'James Wilson';
  SELECT id INTO lisa_id   FROM team_members WHERE name = 'Lisa Park';
  SELECT id INTO david_id  FROM team_members WHERE name = 'David Kumar';

  -- ========================================================================
  -- STORY 1: SUCCESSFUL CAMPAIGN (Benchmark)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
    tracking_setup, competitive_context, constraints,
    meta_pixel_id, meta_ads_account_id,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status, actual_start_date, actual_end_date, final_cost
  ) VALUES (
    'TechStart Q1 Lead Generation',
    'Successful B2B lead generation campaign for tech startup targeting decision-makers',
    'Technology Solutions',
    'completed',
    '2026-01-15', '2026-02-05', 15000.00, 750.00,
    'lead_gen', 'lead_gen', 'CPL', 25.00,
    ARRAY['CTR', 'engagement_rate'],
    '{"demographics": {"age_range": ["25-34", "35-44"], "gender": "all", "location_type": "country", "locations": ["US"]}, "psychographics": {"interests": ["technology", "business software"], "behaviors": ["early adopters"]}}',
    ARRAY['cold', 'lookalike'],
    '{"format": ["video", "carousel"], "theme": "problem_solution", "message": "Streamline your workflow", "cta": "Get Free Demo"}',
    '{"facebook_placements": ["feed", "video_feeds"], "instagram_placements": ["feed", "stories"], "automatic_placements": false, "optimization_goal": "conversions"}',
    '{"lifetime_budget": 15000, "testing_phase_percent": 20, "scaling_phase_percent": 80, "bidding_strategy": "cost_cap", "expected_ctr": 2.5, "expected_cpc": 1.20, "expected_cpa": 25.00}',
    '{"conversion_events": ["Lead", "CompleteRegistration"], "google_analytics": true, "utm_parameters": "utm_source=meta&utm_campaign=q1-leadgen", "crm_integration": true}',
    '{"market_saturation": "medium", "competitor_count": 5, "competitive_advantage": "AI-powered platform", "price_position": "premium", "seasonality": "neutral"}',
    '{"known_constraints": ["standard_timeline"], "historical_ctr": 2.1}',
    '123456789', '998877665544',
    95, 92, 1, 1, 0,
    25, 'proceed', '2026-01-15', '2026-02-05', 13500.00
  ) RETURNING id INTO camp1_id;

  -- Story 1 Phases
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 1, 'Strategy & Planning', 'planning',    '2026-01-15', '2026-01-17', 3, '2026-01-15', '2026-01-17', 3, 'completed', 0, 'neutral', 'Emma Thompson',   ARRAY['Market research','Audience analysis','KPI framework'], ARRAY['Strategy document','Target personas'])
    RETURNING id INTO p1_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 2, 'Creative Development', 'creative',   '2026-01-18', '2026-01-22', 5, '2026-01-18', '2026-01-22', 5, 'completed', 0, 'neutral', 'Mike Rodriguez',  ARRAY['Video production','Ad copy variations','Visual assets'], ARRAY['Video creative','Ad copy set','Landing pages'])
    RETURNING id INTO p2_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 3, 'Compliance & Approval', 'compliance', '2026-01-23', '2026-01-24', 2, '2026-01-23', '2026-01-24', 2, 'completed', 0, 'neutral', 'James Wilson',   ARRAY['Client review','Compliance check'], ARRAY['Approved creatives','Compliance signoff'])
    RETURNING id INTO p3_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 4, 'Technical Setup', 'setup',           '2026-01-25', '2026-01-26', 2, '2026-01-25', '2026-01-26', 2, 'completed', 0, 'neutral', 'Sarah Chen',      ARRAY['Campaign structure','Pixel setup','Tracking verification'], ARRAY['Campaign configured','Tracking verified'])
    RETURNING id INTO p4_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 5, 'Launch', 'launch',                   '2026-01-27', '2026-01-27', 1, '2026-01-27', '2026-01-27', 1, 'completed', 0, 'neutral', 'Sarah Chen',      ARRAY['Campaign launch','Initial monitoring'], ARRAY['Live campaign'])
    RETURNING id INTO p5_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 6, 'Optimization', 'optimization',       '2026-01-28', '2026-02-03', 7, '2026-01-28', '2026-02-02', 6, 'completed', -1, 'positive', 'Emma Thompson', ARRAY['Performance optimization','Budget reallocation','A/B testing'], ARRAY['Optimized campaign','Performance reports'])
    RETURNING id INTO p6_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp1_id, 7, 'Reporting', 'reporting',              '2026-02-04', '2026-02-05', 2, '2026-02-03', '2026-02-05', 2, 'completed', 0, 'neutral', 'David Kumar',    ARRAY['Performance report','Client presentation'], ARRAY['Final report','Insights document'])
    RETURNING id INTO p7_id;

  -- Story 1 Drift Event (positive optimization drift)
  INSERT INTO drift_events (campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, success_pattern, template_created, performance_impact, phase_name, planned_duration, actual_duration, root_cause, actionable_insight, recorded_by)
  VALUES (camp1_id, p6_id, -1, 'positive', 'Early optimization wins enabled faster scaling', 'Achieved target performance 1 day ahead of schedule', 'Quick creative testing in first 48 hours identified winner early', 'Run 3 creative variants simultaneously, pause losers after 48 hours', true, 'positive', 'Optimization', 7, 6, 'Effective A/B testing strategy', 'Always test 3+ variants in parallel for faster optimization', 'Sarah Chen');

  -- Story 1 Performance Metrics
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, engagement_rate)
  VALUES
    (camp1_id, '2026-01-28', 'meta_ads', 45000, 1350, 54, 750.00, 3150.00, 3.000, 0.56, 13.89, 4.20, 38500, 1.17, 0.042),
    (camp1_id, '2026-01-30', 'meta_ads', 52000, 1820, 78, 950.00, 4560.00, 3.500, 0.52, 12.18, 4.80, 44200, 1.18, 0.048),
    (camp1_id, '2026-02-02', 'meta_ads', 68000, 2380, 105, 1100.00, 6300.00, 3.500, 0.46, 10.48, 5.73, 55000, 1.24, 0.052);

  -- Story 1 Risk Score
  INSERT INTO risk_scores (campaign_id, overall_score, risk_level, timeline_risk, budget_risk, resource_risk, performance_risk, risk_factors, mitigation_suggestions, gate_recommendation, gate_reason, calculated_by)
  VALUES (camp1_id, 25, 'low', 15, 20, 10, 30, ARRAY['Competitive market','New audience targeting'], ARRAY['Monitor CPA closely','Prepare backup creative'], 'proceed', 'Low risk profile with adequate budget and experienced team', 'system');

  -- Story 1 Recommendation
  INSERT INTO recommendations (campaign_id, tier, category, title, description, implementation_steps, estimated_effort, estimated_impact, confidence_score, status, generated_by)
  VALUES (camp1_id, 'tactical', 'creative', 'Scale winning creative variant', 'Video variant #2 shows 40% higher CTR. Shift 60% of budget to this creative.', ARRAY['Pause underperforming variants','Increase budget on variant #2','Monitor for 48 hours'], 'low', 'high', 88, 'completed', 'ai');

  -- Story 1 Template
  INSERT INTO campaign_templates (name, description, source_campaign_id, source_campaign_name, success_metrics, default_phases, recommended_timeline_days, suitable_campaign_types, suitable_industries, times_used, success_rate, key_success_factors, created_by, is_public, status)
  VALUES ('Quick Creative Testing Template', 'Run 3 creative variants simultaneously, pause losers after 48 hours for faster optimization', camp1_id, 'TechStart Q1 Lead Generation', 'CPA 45% below target, ROAS exceeded by 68%', '[{"phase_name":"Planning","duration":3},{"phase_name":"Creative","duration":5},{"phase_name":"Approval","duration":2},{"phase_name":"Setup","duration":2},{"phase_name":"Launch","duration":1},{"phase_name":"Optimization","duration":6},{"phase_name":"Reporting","duration":2}]', 21, ARRAY['lead_gen','retargeting'], ARRAY['Technology Solutions','SaaS'], 0, 0.85, ARRAY['Parallel creative testing','48-hour decisioning','Early budget reallocation'], 'Sarah Chen', true, 'active');

  -- ========================================================================
  -- STORY 2: POSITIVE DRIFT SUCCESS (Template Creation)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
    tracking_setup, competitive_context, constraints,
    meta_pixel_id, meta_ads_account_id,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status, actual_start_date, actual_end_date, final_cost
  ) VALUES (
    'FitGear Summer Sale Blitz',
    'Aggressive summer fitness equipment promotion with early launch strategy',
    'Fitness & Athletics',
    'completed',
    '2026-01-20', '2026-02-08', 25000.00, 1250.00,
    'seasonal_promo', 'sales', 'ROAS', 4.5,
    ARRAY['CTR', 'engagement_rate'],
    '{"demographics": {"age_range": ["22-34", "35-44"], "gender": "all", "locations": ["US", "Canada"]}, "psychographics": {"interests": ["fitness", "healthy lifestyle"], "behaviors": ["gym_members"]}}',
    ARRAY['warm', 'lookalike'],
    '{"format": ["carousel", "video"], "theme": "summer_fitness", "message": "Gear up for summer", "cta": "Shop Sale"}',
    '{"facebook_placements": ["feed"], "instagram_placements": ["feed", "reels"], "optimization_goal": "conversions"}',
    '{"lifetime_budget": 25000, "bidding_strategy": "roas_goal", "bidding_target": 4.5}',
    '{"conversion_events": ["Purchase", "AddToCart"], "utm_parameters": "utm_source=meta&utm_campaign=summer-sale"}',
    '{"market_saturation": "high", "competitor_count": 8, "price_position": "mid_range", "seasonality": "peak"}',
    '{"known_constraints": ["compressed_timeline", "seasonal_deadline"]}',
    '987654321', '112233445566',
    98, 94, 3, 3, 0,
    35, 'proceed', '2026-01-20', '2026-02-06', 22000.00
  ) RETURNING id INTO camp2_id;

  -- Story 2 Phases (multiple positive drifts)
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 1, 'Strategy & Planning', 'planning', '2026-01-20', '2026-01-21', 2, '2026-01-20', '2026-01-20', 1, 'completed', -1, 'positive', 'Emma Thompson', ARRAY['Seasonal analysis','Competitor research'], ARRAY['Go-to-market strategy'])
  RETURNING id INTO p1_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 2, 'Creative Development', 'creative', '2026-01-22', '2026-01-25', 4, '2026-01-21', '2026-01-23', 3, 'completed', -1, 'positive', 'Mike Rodriguez', ARRAY['Product photography','Carousel creation'], ARRAY['Summer-themed creatives'])
  RETURNING id INTO p2_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 3, 'Compliance & Approval', 'compliance', '2026-01-26', '2026-01-27', 2, '2026-01-24', '2026-01-24', 1, 'completed', -1, 'positive', 'James Wilson', ARRAY['Expedited client approval'], ARRAY['Approved creatives'])
  RETURNING id INTO p3_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 4, 'Technical Setup', 'setup', '2026-01-28', '2026-01-29', 2, '2026-01-25', '2026-01-26', 2, 'completed', 0, 'neutral', 'Sarah Chen', ARRAY['Campaign structure','Seasonal targeting'], ARRAY['Campaign configured'])
  RETURNING id INTO p4_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 5, 'Launch', 'launch', '2026-01-30', '2026-01-30', 1, '2026-01-27', '2026-01-27', 1, 'completed', 0, 'neutral', 'Sarah Chen', ARRAY['Early launch','Initial monitoring'], ARRAY['Live campaign'])
  RETURNING id INTO p5_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (camp2_id, 6, 'Optimization', 'optimization', '2026-01-31', '2026-02-08', 8, '2026-01-28', '2026-02-06', 10, 'completed', 0, 'neutral', 'Emma Thompson', ARRAY['Aggressive optimization','Budget scaling'], ARRAY['High-performing campaign'])
  RETURNING id INTO p6_id;

  -- Story 2 Drift Events (3 positive drifts → templates)
  INSERT INTO drift_events (campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, success_pattern, template_created, performance_impact, phase_name, planned_duration, actual_duration, root_cause, actionable_insight, recorded_by)
  VALUES
    (camp2_id, p1_id, -1, 'positive', 'Existing research from previous fitness client applied directly', 'Saved 1 day by leveraging previous fitness market analysis', 'Maintain industry research library for quick reference', 'Industry-specific research templates reduce planning time', true, 'positive', 'Strategy & Planning', 2, 1, 'Reusable industry research', 'Build and maintain industry research libraries', 'Emma Thompson'),
    (camp2_id, p2_id, -1, 'positive', 'Client provided high-quality product photos immediately', 'Creative development accelerated due to ready assets', 'Early asset collection reduces creative timeline', 'Request all assets during kickoff, not when needed', true, 'positive', 'Creative Development', 4, 3, 'Pre-collected client assets', 'Always request full asset library at kickoff', 'Mike Rodriguez'),
    (camp2_id, p3_id, -1, 'positive', 'Pre-approved template expedited review process', 'Client approved creatives in 1 day instead of 2', 'Template-based approvals are faster', 'Create pre-approved creative templates for repeat clients', true, 'positive', 'Compliance & Approval', 2, 1, 'Pre-approved templates', 'Use template-based approval for repeat clients', 'James Wilson');

  -- Story 2 Templates
  INSERT INTO campaign_templates (name, description, source_campaign_id, source_campaign_name, success_metrics, default_phases, recommended_timeline_days, suitable_campaign_types, suitable_industries, times_used, success_rate, key_success_factors, created_by, is_public, status)
  VALUES
    ('Fitness Industry Quick-Start', 'Leverage fitness industry research library and asset templates for accelerated development', camp2_id, 'FitGear Summer Sale Blitz', 'Planning reduced by 50%, overall timeline compressed 3 days', '[{"phase_name":"Planning","duration":1},{"phase_name":"Creative","duration":3},{"phase_name":"Approval","duration":1},{"phase_name":"Setup","duration":2},{"phase_name":"Launch","duration":1},{"phase_name":"Optimization","duration":8}]', 16, ARRAY['seasonal_promo','brand_awareness'], ARRAY['Fitness & Athletics','Health & Wellness'], 3, 0.90, ARRAY['Industry research library','Pre-collected assets','Repeat client templates'], 'Emma Thompson', true, 'active'),
    ('Pre-Approved Creative Framework', 'Template-based creative approval for repeat clients to reduce review time', camp2_id, 'FitGear Summer Sale Blitz', 'Approval time reduced by 50%', '[{"phase_name":"Approval","duration":1,"template_based":true}]', 1, ARRAY['seasonal_promo','retargeting'], NULL, 1, 0.95, ARRAY['Pre-approved templates','Client trust','Streamlined process'], 'Mike Rodriguez', true, 'active');

  -- ========================================================================
  -- STORY 3: STRATEGIC FAILURE (Diagnosis Example)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type, creative_strategy, channel_placement, budget_strategy,
    tracking_setup, competitive_context, constraints,
    meta_pixel_id, meta_ads_account_id,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status, actual_start_date, actual_end_date, final_cost
  ) VALUES (
    'LuxuryWatch Brand Awareness',
    'Premium watch brand awareness campaign — clean execution but poor targeting led to underperformance',
    'Luxury Watches',
    'completed',
    '2026-01-10', '2026-01-31', 40000.00, 2000.00,
    'brand_awareness', 'brand_awareness', 'reach', 500000,
    ARRAY['CTR', 'video_views'],
    '{"demographics": {"age_range": ["35-54", "55-65"], "gender": "all", "income_level": "high", "locations": ["US"]}, "psychographics": {"interests": ["luxury goods", "watches", "fine jewelry"]}}',
    ARRAY['cold', 'interest_based'],
    '{"format": ["video"], "theme": "luxury_heritage", "message": "Timeless craftsmanship", "cta": "Discover Collection"}',
    '{"facebook_placements": ["feed", "video_feeds"], "instagram_placements": ["feed", "stories"], "optimization_goal": "reach"}',
    '{"lifetime_budget": 40000, "bidding_strategy": "lowest_cost"}',
    '{"conversion_events": ["ViewContent", "Search"], "google_analytics": true}',
    '{"market_saturation": "high", "competitor_count": 12, "price_position": "premium", "seasonality": "off_peak"}',
    '{"known_constraints": ["luxury_market_challenges", "high_competition"]}',
    '555666777', '333455667788',
    88, 35, 0, 0, 0,
    55, 'proceed', '2026-01-10', '2026-01-31', 42000.00
  ) RETURNING id INTO camp3_id;

  -- Story 3 Phases (clean execution, no drift)
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp3_id, 1, 'Strategy & Planning', 'planning',    '2026-01-10', '2026-01-12', 3, '2026-01-10', '2026-01-12', 3, 'completed', 0, 'neutral', 'Emma Thompson',  ARRAY['Luxury market research','Competitor analysis'], ARRAY['Premium positioning strategy'])
    RETURNING id INTO p1_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp3_id, 2, 'Creative Development', 'creative',   '2026-01-13', '2026-01-18', 6, '2026-01-13', '2026-01-18', 6, 'completed', 0, 'neutral', 'Mike Rodriguez', ARRAY['Luxury video production','Premium messaging'], ARRAY['High-end brand video','Premium ad copy'])
    RETURNING id INTO p2_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp3_id, 3, 'Compliance & Approval', 'compliance', '2026-01-19', '2026-01-20', 2, '2026-01-19', '2026-01-20', 2, 'completed', 0, 'neutral', 'James Wilson',  ARRAY['Luxury brand compliance','Client review'], ARRAY['Approved premium creatives'])
    RETURNING id INTO p3_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp3_id, 4, 'Technical Setup', 'setup',           '2026-01-21', '2026-01-22', 2, '2026-01-21', '2026-01-22', 2, 'completed', 0, 'neutral', 'Sarah Chen',     ARRAY['Campaign structure','Luxury audience setup'], ARRAY['Campaign configured'])
    RETURNING id INTO p4_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp3_id, 5, 'Launch & Monitor', 'launch',         '2026-01-23', '2026-01-31', 9, '2026-01-23', '2026-01-31', 9, 'completed', 0, 'neutral', 'Sarah Chen',     ARRAY['Premium campaign launch','Performance monitoring'], ARRAY['Brand awareness metrics'])
    RETURNING id INTO p5_id;

  -- Story 3 Performance Metrics (underperforming)
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, video_views, engagement_rate, brand_awareness_lift, google_trends_score)
  VALUES
    (camp3_id, '2026-01-25', 'meta_ads', 180000, 1800, 5, 4000.00, 500.00,  1.000, 2.22, 800.00, 0.13, 120000, 1.50, 45000, 0.012, 1.2, 22),
    (camp3_id, '2026-01-28', 'meta_ads', 250000, 2250, 8, 6000.00, 960.00,  0.900, 2.67, 750.00, 0.16, 180000, 1.39, 62000, 0.011, 1.5, 25),
    (camp3_id, '2026-01-31', 'meta_ads', 320000, 2560, 12, 8000.00, 1440.00, 0.800, 3.13, 666.67, 0.18, 240000, 1.33, 80000, 0.010, 1.8, 28);

  -- Story 3 Strategic Failure diagnosis
  INSERT INTO strategic_failures (
    campaign_id, detected_date, detection_criteria, primary_diagnosis, diagnosis_confidence, 
    creative_hypothesis_score, targeting_hypothesis_score, timing_hypothesis_score, value_prop_hypothesis_score, 
    evidence_points, ai_analysis, ai_model_used, recommended_actions, 
    ab_test_suggestions, resolved, lesson_learned, prevention_strategies, analyzed_by
  )
  VALUES (
    camp3_id, 
    '2026-01-28', 
    'CTR below 1% threshold, ROAS below 0.2x after 5 days of data', 
    'audience_mismatch', 
    0.82, 
    30, 85, 40, 65, 
    ARRAY[
      'CTR 60% below industry benchmark for luxury',
      'High frequency but low engagement',
      'Interest-based targeting too broad for luxury segment',
      'Off-peak season for luxury purchases'
    ], 
    'Campaign launched on time with no execution drift. Performance underperformance is driven by audience targeting: interest-based targeting captures casual browsers rather than high-intent luxury buyers. The off-peak seasonality compounds this — luxury watch purchases peak in Q4 holiday season. Recommend shifting to lookalike audiences based on existing customers and retargeting website visitors.', 
    'deepseek-v2.5', 
    ARRAY[
      'Shift to lookalike audiences from customer data',
      'Add retargeting for website visitors',
      'Test engagement-optimized creative',
      'Consider pausing until Q4 peak season'
    ],
    '[
      {
        "test_type": "Audience Targeting Test",
        "hypothesis": "Interest-based targeting is too broad for luxury segment; lookalike audiences will have higher purchase intent",
        "control_variant": "Current interest-based targeting (luxury interests, watch enthusiasts)",
        "test_variant": "1% Lookalike audience from existing high-value customers + website visitors (past 30 days)",
        "setup_instructions": [
          "Create lookalike audience from customer list in Meta Ads Manager",
          "Set up 50/50 budget split between control and test",
          "Duplicate ad sets with identical creative but different audiences",
          "Implement conversion tracking for both variants",
          "Run for minimum 7 days or 100 conversions per variant"
        ],
        "success_criteria": "Test variant achieves >30% improvement in CPA and >2x ROAS vs control",
        "recommended_duration_days": 14,
        "expected_impact": "25-40% reduction in CPA, 2-3x improvement in ROAS",
        "confidence_level": 0.85
      },
      {
        "test_type": "Creative Messaging Test",
        "hypothesis": "Current generic luxury messaging not resonating; exclusive/scarcity messaging will drive higher engagement",
        "control_variant": "Current creative: product-focused lifestyle imagery",
        "test_variant": "Limited edition messaging with urgency (Only 500 pieces, Exclusive to Q1 2026)",
        "setup_instructions": [
          "Develop 3 creative variants with scarcity/exclusivity angles",
          "Test against current best performer",
          "Use same targeting for fair comparison",
          "Monitor engagement rate and CTR as leading indicators",
          "Scale winning variant after 72 hours of data"
        ],
        "success_criteria": "Test creative achieves >50% higher CTR and >20% higher conversion rate",
        "recommended_duration_days": 7,
        "expected_impact": "15-25% improvement in CTR, 10-20% lift in conversion rate",
        "confidence_level": 0.72
      },
      {
        "test_type": "Seasonal Timing Test",
        "hypothesis": "Off-peak seasonality is suppressing demand; pausing and relaunching in Q4 will yield better results",
        "control_variant": "Continue running campaign at current budget through Q1",
        "test_variant": "Pause campaign, save 70% of budget for Q4 relaunch (Oct-Dec)",
        "setup_instructions": [
          "Document current performance as baseline",
          "Gradually reduce budget by 50% over 1 week",
          "Pause campaign but retain all setup",
          "Schedule Q4 relaunch with 2x budget",
          "Compare Q4 results to Q1 extrapolated performance"
        ],
        "success_criteria": "Q4 campaign achieves >3x ROAS (vs current 0.16x) and <$300 CPA (vs current $750)",
        "recommended_duration_days": 90,
        "expected_impact": "5-10x improvement in ROAS during peak season",
        "confidence_level": 0.78
      }
    ]'::jsonb,
    false, 
    'Interest-based targeting insufficient for luxury segments; need behavioral and purchase-intent signals', 
    ARRAY[
      'Use purchase-history lookalikes for luxury',
      'Validate seasonality before committing budget',
      'Start with small test budget before scaling'
    ], 
    'ai'
  );

  -- Story 3 Risk Score
  INSERT INTO risk_scores (campaign_id, overall_score, risk_level, timeline_risk, budget_risk, resource_risk, performance_risk, risk_factors, mitigation_suggestions, gate_recommendation, gate_reason, calculated_by)
  VALUES (camp3_id, 55, 'medium', 20, 45, 15, 75, ARRAY['High market saturation','Off-peak seasonality','Premium price point limits audience','12 active competitors'], ARRAY['Validate targeting with small test budget','Prepare alternative audience strategies','Set performance checkpoints at day 3, 7'], 'proceed', 'Proceed with caution — performance risk is elevated due to market saturation and off-peak timing', 'system');

  -- ========================================================================
  -- STORY 4: OVERRIDE EXAMPLE (Learning Loop)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget,
    campaign_type, primary_objective, primary_kpi, target_value,
    target_audience, competitive_context,
    meta_pixel_id, meta_ads_account_id,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    'GreenHome Eco Products Launch',
    'New product launch where AI recommended pausing high-CPA ad sets, but user kept them running — outcome validates the override',
    'Eco-Friendly Home',
    'completed',
    '2026-01-25', '2026-02-15', 18000.00,
    'new_product_launch', 'sales', 'ROAS', 3.0,
    '{"demographics": {"age_range": ["25-44"], "locations": ["US"]}, "psychographics": {"interests": ["sustainability", "eco-friendly"], "behaviors": ["green_consumers"]}}',
    '{"market_saturation": "low", "competitor_count": 3, "price_position": "mid_range", "seasonality": "neutral", "market_trends": "growing"}',
    '444555666', '556677889900',
    82, 88, 2, 0, 2,
    45, 'proceed'
  ) RETURNING id INTO camp4_id;

  -- Story 4 Phases (some delays)
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp4_id, 1, 'Strategy & Planning', 'planning', '2026-01-25', '2026-01-27', 3, '2026-01-25', '2026-01-27', 3, 'completed', 0, 'neutral', 'Emma Thompson', ARRAY['Eco market research','Competitor analysis'], ARRAY['Green marketing strategy'])
    RETURNING id INTO p1_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp4_id, 2, 'Creative Development', 'creative', '2026-01-28', '2026-02-01', 5, '2026-01-28', '2026-02-02', 6, 'completed', 1, 'negative', 'Lisa Park', ARRAY['Eco-themed creative','Product photography'], ARRAY['Sustainability-focused ads'])
    RETURNING id INTO p2_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp4_id, 3, 'Launch & Optimize', 'launch', '2026-02-02', '2026-02-15', 14, '2026-02-03', '2026-02-15', 13, 'completed', 1, 'negative', 'Sarah Chen', ARRAY['Campaign launch','Performance optimization'], ARRAY['Live campaign','Performance reports'])
    RETURNING id INTO p3_id;

  -- Story 4 Drift Events
  INSERT INTO drift_events (campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, phase_name, planned_duration, actual_duration, root_cause, recorded_by)
  VALUES
    (camp4_id, p2_id, 1, 'negative', 'Extra revision round for eco-messaging accuracy', 'Minor 1-day delay, launch shifted by 1 day', 'Eco claims require additional fact-checking time', 'Creative Development', 5, 6, 'Sustainability claim verification', 'Lisa Park'),
    (camp4_id, p3_id, 1, 'negative', 'Late start due to creative delay cascade', 'Campaign started 1 day late', 'Build buffer time for sustainability messaging compliance', 'Launch & Optimize', 14, 13, 'Cascading delay from creative phase', 'Sarah Chen');

  -- Story 4 Risk Score (moderate risk, proceeded)
  INSERT INTO risk_scores (campaign_id, overall_score, risk_level, timeline_risk, budget_risk, resource_risk, performance_risk, risk_factors, mitigation_suggestions, gate_recommendation, gate_reason, calculated_by)
  VALUES (camp4_id, 45, 'medium', 35, 40, 20, 55, ARRAY['New market with limited historical data','First eco-product campaign for team','Sustainability claims require extra compliance'], ARRAY['Start with 30% test budget','Monitor CPA daily','Set strict day-7 performance gate'], 'proceed', 'Moderate risk profile — proceed with close monitoring and testing budget allocation', 'system');

  -- Story 4 AI Recommendation (to be rejected by user)
  INSERT INTO recommendations (campaign_id, recommendation_type, tier, category, title, description, implementation_steps, implementation_notes, impact, effort, confidence, expected_outcome, status, accepted_at, rejected_reason, ai_model, generated_by)
  VALUES (camp4_id, 'tactical', 'tactical', 'budget', 'Pause High-CPA Ad Sets', 'Ad sets targeting 45-54 age group show CPA of $48 (60% above target). Recommend pausing these ad sets and reallocating budget to better-performing 25-34 demographic.', ARRAY['Pause ad sets: GreenHome_45-54_Feed','Reallocate $3,200 to GreenHome_25-34_Stories','Monitor for 48 hours','Re-enable if market data changes'], 'System detected sustained high CPA in older demographic after 5 days of optimization. Statistical confidence: 87%.', 'medium', 'low', 87, 'Reduce overall CPA by $8-12, improve ROAS from 2.1 to 2.6', 'rejected', NULL, 'I see the high CPA, but market research shows 45-54 eco-consumers have 3x higher lifetime value. Early CPA will normalize as we build brand awareness in this premium segment. Keeping ad sets running.', 'llama-3.3-70b-versatile', 'AI Engine') RETURNING id INTO rec4_id;

  -- Story 4 Override Event (user rejected AI recommendation to pause ad sets)
  INSERT INTO override_events (campaign_id, recommendation_id, override_type, original_recommendation, user_action, reason, system_confidence, risk_score_at_time, outcome, outcome_explanation, lesson_learned, system_was_correct, overridden_by)
  VALUES (camp4_id, rec4_id, 'ai_recommendation', 'pause', 'proceed', 'Market research shows 45-54 eco-consumers have 3x higher lifetime value despite higher CPA. Early brand awareness phase — expect CPA to normalize after initial exposure. This demographic drives premium product sales.', 87, 45, 'success', 'User was correct: After 10 days, 45-54 demographic CPA dropped to $28 (12% better than target) as brand awareness built. This segment drove 42% of total revenue with 3.8x ROAS vs 2.6x for 25-34. Higher initial CPA reflected learning phase, not poor targeting.', 'AI should factor in lifetime value and learning phase duration when evaluating CPA performance. Early high CPA in premium segments may indicate quality audience, not poor targeting. Consider segment-specific success metrics beyond immediate CPA.', false, 'James Wilson');

  -- ========================================================================
  -- STORY 5: ACCOUNTABILITY EXAMPLE (Client Delay Tracking)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget,
    campaign_type, primary_objective, primary_kpi, target_value,
    target_audience, competitive_context,
    meta_pixel_id, meta_ads_account_id,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    'SpringStyle Fashion Collection Launch',
    'Fashion campaign with significant client-caused delays in creative approval — demonstrates accountability tracking',
    'Fashion Retail',
    'in_progress',
    '2026-02-01', '2026-02-28', 30000.00,
    'new_product_launch', 'sales', 'ROAS', 3.5,
    '{"demographics": {"age_range": ["18-34"], "gender": "female", "locations": ["US"]}, "psychographics": {"interests": ["fashion", "spring trends"], "behaviors": ["online_shoppers"]}}',
    '{"market_saturation": "high", "competitor_count": 15, "price_position": "mid_range", "seasonality": "peak"}',
    '777888999', '667788990011',
    55, 70, 3, 0, 3,
    65, 'proceed'
  ) RETURNING id INTO camp5_id;

  -- Story 5 Phases (delays in creative and approval)
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp5_id, 1, 'Strategy & Planning', 'planning', '2026-02-01', '2026-02-02', 2, '2026-02-01', '2026-02-02', 2, 'completed', 0, 'neutral', 'Emma Thompson', ARRAY['Fashion trend research','Seasonal strategy'], ARRAY['Spring collection strategy'])
    RETURNING id INTO p1_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp5_id, 2, 'Creative Development', 'creative', '2026-02-03', '2026-02-06', 4, '2026-02-03', '2026-02-08', 6, 'completed', 2, 'negative', 'Mike Rodriguez', ARRAY['Spring collection photos','Carousel creatives','Video content'], ARRAY['Seasonal ad creatives'])
    RETURNING id INTO p2_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp5_id, 3, 'Compliance & Approval', 'compliance', '2026-02-07', '2026-02-09', 3, '2026-02-09', '2026-02-13', 5, 'completed', 2, 'negative', 'James Wilson', ARRAY['Client approval with revisions','Brand compliance'], ARRAY['Approved creatives after 2 revision rounds'])
    RETURNING id INTO p3_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES
    (camp5_id, 4, 'Technical Setup', 'setup', '2026-02-10', '2026-02-11', 2, '2026-02-14', NULL, NULL, 'in_progress', 0, NULL, 'Sarah Chen', ARRAY['Campaign structure','Shopping catalog integration'], ARRAY['Campaign configured'])
    RETURNING id INTO p4_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, status, owner, activities, deliverables)
  VALUES
    (camp5_id, 5, 'Launch', 'launch', '2026-02-12', '2026-02-12', 1, 'pending', 'Sarah Chen', ARRAY['Campaign launch'], ARRAY['Live campaign'])
    RETURNING id INTO p5_id;
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, status, owner, activities, deliverables)
  VALUES
    (camp5_id, 6, 'Optimization', 'optimization', '2026-02-13', '2026-02-26', 14, 'pending', 'Emma Thompson', ARRAY['Performance optimization','Budget scaling'], ARRAY['Optimized campaign'])
    RETURNING id INTO p6_id;

  -- Story 5 Drift Events
  INSERT INTO drift_events (campaign_id, phase_id, drift_days, drift_type, reason, impact_description, lesson_learned, phase_name, planned_duration, actual_duration, root_cause, attribution, impact_on_timeline, actionable_insight, recorded_by)
  VALUES
    (camp5_id, p2_id, 2, 'negative', 'Client delayed providing spring collection product photos', 'Creative development extended by 2 days waiting for assets', 'Require all product assets before creative phase starts', 'Creative Development', 4, 6, 'Client asset delivery delay', 'client', 'Cascading 2-day delay to all subsequent phases', 'Add asset delivery milestone to kickoff checklist', 'Mike Rodriguez'),
    (camp5_id, p3_id, 2, 'negative', 'Client requested 2 additional revision rounds on creative direction', 'Approval phase took 5 days instead of planned 3', 'Limit revision rounds in SOW or add buffer for fashion clients', 'Compliance & Approval', 3, 5, 'Multiple client revision requests', 'client', 'Launch delayed by cumulative 4 days from planned date', 'Cap revision rounds in contract, build approval buffer for fashion', 'James Wilson');

  -- Story 5 Stakeholder Actions (accountability tracking)
  INSERT INTO stakeholder_actions (campaign_id, phase_id, action_type, action_description, stakeholder_name, stakeholder_role, stakeholder_type, requested_date, expected_date, actual_date, overdue_days, status, delay_reason, delay_attribution, delay_impact, critical_path, notes)
  VALUES
    (camp5_id, p2_id, 'delivery', 'Provide spring collection product photos and lifestyle images', 'Maria Santos', 'Marketing Director', 'client', '2026-02-01', '2026-02-03', '2026-02-05', 2, 'completed', 'Internal photoshoot delayed due to sample availability', 'client', 'Creative phase start delayed by 2 days, cascading to all subsequent phases', true, 'Client acknowledged delay but could not expedite due to supply chain issues'),
    (camp5_id, p3_id, 'approval', 'Review and approve carousel creative concepts', 'Maria Santos', 'Marketing Director', 'client', '2026-02-09', '2026-02-10', '2026-02-11', 1, 'completed', 'Requested revision to color palette — did not match spring collection branding', 'client', 'Additional 1-day delay added to approval timeline', true, 'First round feedback was on brand colors, not content — could have been caught in brief stage'),
    (camp5_id, p3_id, 'approval', 'Final creative sign-off after revisions', 'Maria Santos', 'Marketing Director', 'client', '2026-02-11', '2026-02-12', '2026-02-13', 1, 'completed', 'Second revision requested for video thumbnail — wanted different model pose', 'client', 'Cumulative 4-day delay from original launch date', true, 'Second revision was minor but added another full day due to approval process'),
    (camp5_id, p4_id, 'delivery', 'Provide product catalog feed for shopping ads', 'Tech Support Team', 'IT Department', 'client', '2026-02-10', '2026-02-11', NULL, NULL, 'pending', NULL, NULL, 'Blocking technical setup completion', true, 'Waiting on client IT team to export product feed from their e-commerce platform');

  -- Story 5 Recommendations
  INSERT INTO recommendations (campaign_id, tier, category, title, description, implementation_steps, estimated_effort, estimated_impact, confidence_score, status, generated_by)
  VALUES
    (camp5_id, 'immediate', 'timeline', 'Compress optimization phase to recover lost time', 'Consider reducing optimization from 14 days to 10 days to partially recover the 4-day delay.', ARRAY['Reduce optimization phase by 4 days','Increase daily monitoring frequency','Set aggressive day-3 performance gate'], 'medium', 'medium', 75, 'suggested', 'ai'),
    (camp5_id, 'strategic', 'process', 'Add asset delivery milestones to client contracts', 'Future fashion campaigns should include contractual asset delivery deadlines with penalty clauses for delays.', ARRAY['Draft asset delivery schedule template','Include in next client SOW','Add automated reminder notifications'], 'low', 'high', 90, 'suggested', 'ai');

  -- ========================================================================
  -- STORY 6: TEAM CAPACITY CONFLICT (Resource Warning)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget,
    campaign_type, primary_objective, primary_kpi, target_value,
    target_audience,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    'MultiClient Holiday Rush',
    'Campaign created during peak period to demonstrate team capacity conflicts and overallocation warnings',
    'Retail General',
    'planning',
    '2026-02-15', '2026-03-15', 20000.00,
    'seasonal_promo', 'sales', 'ROAS', 3.0,
    '{"demographics": {"age_range": ["25-54"], "locations": ["US"]}}',
    100, 100, 0, 0, 0,
    68, 'adjust'
  ) RETURNING id INTO camp6_id;

  -- Story 6 Phases (planning only)
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, status, owner, activities, deliverables)
  VALUES
    (camp6_id, 1, 'Strategy & Planning', 'planning', '2026-02-15', '2026-02-17', 3, 'pending', 'Emma Thompson', ARRAY['Market research','Holiday strategy'], ARRAY['Campaign brief']),
    (camp6_id, 2, 'Creative Development', 'creative', '2026-02-18', '2026-02-24', 7, 'pending', 'Lisa Park', ARRAY['Holiday creative suite'], ARRAY['Full creative package']),
    (camp6_id, 3, 'Launch & Optimize', 'launch', '2026-02-25', '2026-03-15', 19, 'pending', 'Sarah Chen', ARRAY['Campaign launch','Optimization'], ARRAY['Live campaign']);

  -- Story 6 Risk Score (resource-driven)
  INSERT INTO risk_scores (campaign_id, overall_score, risk_level, timeline_risk, budget_risk, resource_risk, performance_risk, risk_factors, mitigation_suggestions, gate_recommendation, gate_reason, calculated_by)
  VALUES (camp6_id, 68, 'high', 40, 35, 90, 50, ARRAY['Lisa Park at 95% utilization — cannot take additional creative work','Mike Rodriguez at 90% utilization — limited backup capacity','Peak period with 3 other active campaigns','No buffer for unexpected delays'], ARRAY['Redistribute creative work across team','Consider outsourcing creative to freelancer','Delay campaign start by 1 week to allow capacity','Reduce creative scope to essentials only'], 'adjust', 'Resource risk is critical — primary creative resource (Lisa Park) is at 95% utilization with 4 campaigns assigned. Campaign should be delayed or scoped down.', 'system');

  -- ========================================
  -- TEAM CAPACITY (across all campaigns)
  -- ========================================
  -- Shows current week allocations demonstrating the overload scenario from Story 6
  INSERT INTO team_capacity (team_member_id, campaign_id, allocated_hours, week_starting, actual_hours, utilization_percentage, allocation_status)
  VALUES
    -- Sarah Chen: 85% utilized across 2 campaigns
    (sarah_id, camp1_id, 16.0, '2026-02-03', 15.0, 40.0, 'completed'),
    (sarah_id, camp5_id, 18.0, '2026-02-03', NULL, 45.0, 'in_progress'),
    -- Mike Rodriguez: 90% utilized across 3 campaigns
    (mike_id, camp1_id, 12.0, '2026-02-03', 12.0, 30.0, 'completed'),
    (mike_id, camp2_id, 14.0, '2026-02-03', 14.0, 35.0, 'completed'),
    (mike_id, camp5_id, 10.0, '2026-02-03', 8.0, 25.0, 'in_progress'),
    -- Emma Thompson: 80% utilized across 2 campaigns
    (emma_id, camp1_id, 14.0, '2026-02-03', 14.0, 35.0, 'completed'),
    (emma_id, camp5_id, 18.0, '2026-02-03', NULL, 45.0, 'in_progress'),
    -- James Wilson: 75% utilized
    (james_id, camp5_id, 12.0, '2026-02-03', 10.0, 30.0, 'in_progress'),
    (james_id, camp4_id, 18.0, '2026-02-03', 18.0, 45.0, 'completed'),
    -- Lisa Park: 95% utilized across 4 campaigns (OVERLOADED)
    (lisa_id, camp2_id, 10.0, '2026-02-03', 10.0, 25.0, 'completed'),
    (lisa_id, camp4_id, 12.0, '2026-02-03', 12.0, 30.0, 'completed'),
    (lisa_id, camp5_id, 8.0, '2026-02-03', NULL, 20.0, 'in_progress'),
    (lisa_id, camp6_id, 8.0, '2026-02-03', NULL, 20.0, 'planned'),
    -- David Kumar: 70% utilized
    (david_id, camp1_id, 14.0, '2026-02-03', 14.0, 35.0, 'completed'),
    (david_id, camp3_id, 14.0, '2026-02-03', 12.0, 35.0, 'completed');

  RAISE NOTICE 'Seed data complete. Campaign IDs:';
  RAISE NOTICE '  Story 1 (Successful):     %', camp1_id;
  RAISE NOTICE '  Story 2 (Positive Drift):  %', camp2_id;
  RAISE NOTICE '  Story 3 (Strategic Fail):  %', camp3_id;
  RAISE NOTICE '  Story 4 (Override):        %', camp4_id;
  RAISE NOTICE '  Story 5 (Accountability):  %', camp5_id;
  RAISE NOTICE '  Story 6 (Capacity):        %', camp6_id;

END $$;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
