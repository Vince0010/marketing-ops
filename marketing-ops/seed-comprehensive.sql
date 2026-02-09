-- ============================================================================
-- COMPREHENSIVE SEED DATA: Good & Bad Campaigns with Tasks & Correlated Meta Ads
-- ============================================================================
-- Run after database-schema.sql and meta-ads-migration.sql
-- Features:
-- - 2 Good performing campaigns
-- - 2 Bad performing campaigns  
-- - Execution tasks (ad making, post creation, creative work)
-- - Meta Ads engagement that matches audience insight numbers
-- ============================================================================

-- Clear existing data
DO $cleanup$
BEGIN
  DELETE FROM meta_ads_audiences;
  DELETE FROM meta_ads_creatives;
  DELETE FROM meta_ads_placements;
  DELETE FROM meta_ads_metrics;
  DELETE FROM marketer_actions WHERE title LIKE '%Seed%' OR created_by = 'seed_script';
  DELETE FROM task_phase_history WHERE phase_name LIKE '%Seed%';
  DELETE FROM performance_metrics WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '%[SEED]%');
  DELETE FROM drift_events WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '%[SEED]%');
  DELETE FROM execution_phases WHERE campaign_id IN (SELECT id FROM campaigns WHERE name LIKE '%[SEED]%');
  DELETE FROM campaigns WHERE name LIKE '%[SEED]%';
EXCEPTION WHEN undefined_table THEN NULL;
END $cleanup$;

-- ============================================================================
-- MAIN SEED BLOCK
-- ============================================================================
DO $$
DECLARE
  -- Campaign IDs
  good_camp1_id UUID;
  good_camp2_id UUID;
  bad_camp1_id UUID;
  bad_camp2_id UUID;
  -- Phase IDs
  p1_id UUID; p2_id UUID; p3_id UUID; p4_id UUID; p5_id UUID;
BEGIN

  -- ========================================================================
  -- GOOD CAMPAIGN 1: High-Performing E-commerce
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    '[SEED] Premium Electronics Launch',
    'High-performing product launch with excellent ROAS and strong audience targeting',
    'Consumer Electronics',
    'in_progress',
    '2026-02-01', '2026-02-28', 50000.00, 1800.00,
    'new_product_launch', 'sales', 'ROAS', 4.0,
    ARRAY['CTR', 'CPA'],
    '{"demographics": {"age_range": ["25-34", "35-44"], "gender": "all", "locations": ["US", "Canada"]}, "psychographics": {"interests": ["technology", "gadgets"], "behaviors": ["early_adopters", "online_shoppers"]}}',
    ARRAY['lookalike', 'interest_based'],
    92, 95, 0, 1, 0,
    18, 'proceed'
  ) RETURNING id INTO good_camp1_id;

  -- Phases for Good Campaign 1
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp1_id, 1, 'Strategy & Planning', 'planning', '2026-02-01', '2026-02-03', 3, '2026-02-01', '2026-02-03', 3, 'completed', 0, 'neutral', 'Sarah Chen', ARRAY['Market research', 'Competitor analysis'], ARRAY['Strategy document']) RETURNING id INTO p1_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp1_id, 2, 'Creative Development', 'creative', '2026-02-04', '2026-02-08', 5, '2026-02-04', '2026-02-07', 4, 'completed', -1, 'positive', 'Mike Rodriguez', ARRAY['Video production', 'Banner design', 'Ad copy'], ARRAY['Video ads', 'Static banners', 'Carousel creatives']) RETURNING id INTO p2_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp1_id, 3, 'Campaign Setup', 'setup', '2026-02-08', '2026-02-09', 2, '2026-02-08', '2026-02-09', 2, 'completed', 0, 'neutral', 'Emma Thompson', ARRAY['Audience setup', 'Pixel config', 'Campaign structure'], ARRAY['Configured campaigns']) RETURNING id INTO p3_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp1_id, 4, 'Launch & Optimization', 'launch', '2026-02-10', '2026-02-25', 16, '2026-02-10', NULL, NULL, 'in_progress', 0, 'neutral', 'Sarah Chen', ARRAY['Campaign launch', 'Daily optimization', 'A/B testing'], ARRAY['Live campaigns', 'Performance reports']) RETURNING id INTO p4_id;

  -- ========================================================================
  -- GOOD CAMPAIGN 2: Brand Awareness Success
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    '[SEED] Organic Food Brand Awareness',
    'Successful brand awareness campaign with high engagement and reach',
    'Food & Beverage',
    'completed',
    '2026-01-15', '2026-02-05', 35000.00, 1500.00,
    'brand_awareness', 'brand_awareness', 'reach', 1000000,
    ARRAY['engagement_rate', 'video_views'],
    '{"demographics": {"age_range": ["25-44"], "gender": "all", "locations": ["US"]}, "psychographics": {"interests": ["organic food", "healthy living", "sustainability"], "behaviors": ["health_conscious"]}}',
    ARRAY['interest_based', 'lookalike'],
    98, 92, 1, 1, 0,
    15, 'proceed'
  ) RETURNING id INTO good_camp2_id;

  -- Phases for Good Campaign 2
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp2_id, 1, 'Strategy & Creative', 'planning', '2026-01-15', '2026-01-19', 5, '2026-01-15', '2026-01-18', 4, 'completed', -1, 'positive', 'Emma Thompson', ARRAY['Brand positioning', 'Content strategy'], ARRAY['Brand guidelines', 'Content calendar']) RETURNING id INTO p1_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp2_id, 2, 'Content Production', 'creative', '2026-01-19', '2026-01-24', 6, '2026-01-19', '2026-01-24', 6, 'completed', 0, 'neutral', 'Lisa Park', ARRAY['Video shoot', 'Social posts', 'Stories content'], ARRAY['Video content', 'Social assets']) RETURNING id INTO p2_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (good_camp2_id, 3, 'Campaign Execution', 'launch', '2026-01-25', '2026-02-05', 12, '2026-01-25', '2026-02-05', 12, 'completed', 0, 'neutral', 'Sarah Chen', ARRAY['Launch', 'Optimization', 'Reporting'], ARRAY['Final report']) RETURNING id INTO p3_id;

  -- ========================================================================
  -- BAD CAMPAIGN 1: Poor Targeting (Audience Mismatch)
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    '[SEED] Luxury Skincare Misfire',
    'Campaign with misaligned audience targeting - low CTR and poor ROAS',
    'Beauty & Skincare',
    'in_progress',
    '2026-02-03', '2026-02-28', 40000.00, 1600.00,
    'sales', 'sales', 'ROAS', 3.5,
    ARRAY['CTR', 'CPA'],
    '{"demographics": {"age_range": ["18-24"], "gender": "all", "locations": ["US"]}, "psychographics": {"interests": ["beauty", "makeup"], "behaviors": ["budget_shoppers"]}}',
    ARRAY['cold', 'interest_based'],
    75, 28, 2, 0, 2,
    72, 'adjust'
  ) RETURNING id INTO bad_camp1_id;

  -- Phases for Bad Campaign 1
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp1_id, 1, 'Rush Planning', 'planning', '2026-02-03', '2026-02-04', 2, '2026-02-03', '2026-02-04', 2, 'completed', 0, 'neutral', 'Emma Thompson', ARRAY['Quick research', 'Basic targeting'], ARRAY['Brief strategy doc']) RETURNING id INTO p1_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp1_id, 2, 'Creative Development', 'creative', '2026-02-05', '2026-02-08', 4, '2026-02-05', '2026-02-09', 5, 'completed', 1, 'negative', 'Lisa Park', ARRAY['Generic ads', 'Stock imagery'], ARRAY['Basic creatives']) RETURNING id INTO p2_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp1_id, 3, 'Live Campaign', 'launch', '2026-02-09', '2026-02-28', 20, '2026-02-10', NULL, NULL, 'in_progress', 1, 'negative', 'Sarah Chen', ARRAY['Struggling optimization', 'Budget waste'], ARRAY['Poor performance']) RETURNING id INTO p3_id;

  -- ========================================================================
  -- BAD CAMPAIGN 2: Creative Fatigue & Budget Issues
  -- ========================================================================
  INSERT INTO campaigns (
    name, description, industry, status, start_date, end_date, total_budget, daily_budget,
    campaign_type, primary_objective, primary_kpi, target_value, secondary_kpis,
    target_audience, audience_type,
    operational_health, performance_health, drift_count, positive_drift_count, negative_drift_count,
    risk_score, gate_status
  ) VALUES (
    '[SEED] Fitness App Burnout',
    'Campaign suffering from creative fatigue and poor budget allocation',
    'Health & Fitness',
    'in_progress',
    '2026-01-20', '2026-02-20', 25000.00, 800.00,
    'lead_gen', 'lead_gen', 'CPL', 15.00,
    ARRAY['CTR', 'engagement_rate'],
    '{"demographics": {"age_range": ["25-44"], "gender": "all", "locations": ["US"]}, "psychographics": {"interests": ["fitness", "weight loss"], "behaviors": ["gym_members"]}}',
    ARRAY['interest_based'],
    58, 35, 3, 0, 3,
    78, 'pause'
  ) RETURNING id INTO bad_camp2_id;

  -- Phases for Bad Campaign 2
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp2_id, 1, 'Planning', 'planning', '2026-01-20', '2026-01-22', 3, '2026-01-20', '2026-01-23', 4, 'completed', 1, 'negative', 'Emma Thompson', ARRAY['Market analysis'], ARRAY['Strategy doc']) RETURNING id INTO p1_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp2_id, 2, 'Creative', 'creative', '2026-01-23', '2026-01-28', 6, '2026-01-24', '2026-01-30', 7, 'completed', 1, 'negative', 'Mike Rodriguez', ARRAY['Single ad variant', 'No A/B testing'], ARRAY['Limited creatives']) RETURNING id INTO p2_id;
  
  INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_start_date, planned_end_date, planned_duration_days, actual_start_date, actual_end_date, actual_duration_days, status, drift_days, drift_type, owner, activities, deliverables)
  VALUES (bad_camp2_id, 3, 'Campaign Run', 'launch', '2026-01-29', '2026-02-20', 23, '2026-01-31', NULL, NULL, 'blocked', 1, 'negative', 'Sarah Chen', ARRAY['Fatigued ads', 'Rising CPL'], ARRAY['Poor leads']) RETURNING id INTO p3_id;

  -- ========================================================================
  -- EXECUTION TASKS (Ad Making / Post Making Related)
  -- ========================================================================
  
  -- Good Campaign 1 Tasks
  INSERT INTO marketer_actions (campaign_id, phase_id, title, description, action_type, status, priority, created_by, timestamp) VALUES
    (good_camp1_id, p2_id, 'Create product demo video 60s', 'High-quality product demonstration video for feed placement', 'creative_asset', 'completed', 'high', 'seed_script', NOW() - INTERVAL '5 days'),
    (good_camp1_id, p2_id, 'Design carousel ad - 5 slides', 'Feature highlight carousel showcasing key benefits', 'creative_asset', 'completed', 'high', 'seed_script', NOW() - INTERVAL '4 days'),
    (good_camp1_id, p2_id, 'Write ad copy variations x6', 'Multiple headline and body text variations for A/B testing', 'copy_review', 'completed', 'medium', 'seed_script', NOW() - INTERVAL '4 days'),
    (good_camp1_id, p2_id, 'Create Instagram Stories ads', 'Vertical format optimized for Stories placement', 'creative_asset', 'completed', 'medium', 'seed_script', NOW() - INTERVAL '3 days'),
    (good_camp1_id, p4_id, 'Design retargeting banner set', 'Dynamic product ads for cart abandoners', 'creative_asset', 'in_progress', 'high', 'seed_script', NOW() - INTERVAL '1 day'),
    (good_camp1_id, p4_id, 'Create social proof post', 'Customer testimonial compilation for social proof', 'creative_asset', 'planned', 'medium', 'seed_script', NOW());

  -- Good Campaign 2 Tasks
  INSERT INTO marketer_actions (campaign_id, phase_id, title, description, action_type, status, priority, created_by, timestamp) VALUES
    (good_camp2_id, p2_id, 'Produce brand story video 90s', 'Emotional brand narrative video for awareness', 'creative_asset', 'completed', 'critical', 'seed_script', NOW() - INTERVAL '15 days'),
    (good_camp2_id, p2_id, 'Design Facebook carousel posts', 'Educational content about organic ingredients', 'creative_asset', 'completed', 'high', 'seed_script', NOW() - INTERVAL '14 days'),
    (good_camp2_id, p2_id, 'Create Instagram Reels x4', 'Short-form video content for Reels placement', 'creative_asset', 'completed', 'high', 'seed_script', NOW() - INTERVAL '13 days'),
    (good_camp2_id, p2_id, 'Write social media captions', 'Engaging captions for all post formats', 'copy_review', 'completed', 'medium', 'seed_script', NOW() - INTERVAL '12 days');

  -- Bad Campaign 1 Tasks (shows lack of proper creative work)
  INSERT INTO marketer_actions (campaign_id, phase_id, title, description, action_type, status, priority, created_by, timestamp) VALUES
    (bad_camp1_id, p2_id, 'Use existing stock photos', 'Repurposed generic beauty stock images', 'creative_asset', 'completed', 'low', 'seed_script', NOW() - INTERVAL '6 days'),
    (bad_camp1_id, p2_id, 'Write single ad copy', 'Only one ad copy variant - no testing', 'copy_review', 'completed', 'low', 'seed_script', NOW() - INTERVAL '5 days'),
    (bad_camp1_id, p3_id, 'Create new targeting audience', 'URGENT: Current targeting not working', 'audience_targeting', 'in_progress', 'critical', 'seed_script', NOW() - INTERVAL '1 day'),
    (bad_camp1_id, p3_id, 'Redesign all ad creatives', 'Current ads not resonating with audience', 'creative_asset', 'planned', 'critical', 'seed_script', NOW());

  -- Bad Campaign 2 Tasks (shows creative fatigue issues)
  INSERT INTO marketer_actions (campaign_id, phase_id, title, description, action_type, status, priority, created_by, timestamp) VALUES
    (bad_camp2_id, p2_id, 'Create single video ad', 'Only one creative variant produced', 'creative_asset', 'completed', 'medium', 'seed_script', NOW() - INTERVAL '12 days'),
    (bad_camp2_id, p3_id, 'URGENT: Refresh fatigued creatives', 'Frequency too high, CTR dropping daily', 'creative_asset', 'in_progress', 'critical', 'seed_script', NOW() - INTERVAL '2 days'),
    (bad_camp2_id, p3_id, 'Create new ad variations x3', 'Need fresh creatives to combat fatigue', 'creative_asset', 'blocked', 'critical', 'seed_script', NOW() - INTERVAL '1 day'),
    (bad_camp2_id, p3_id, 'Pause underperforming ads', 'Stop budget bleed on fatigued creatives', 'optimization', 'planned', 'high', 'seed_script', NOW());

  -- ========================================================================
  -- META ADS METRICS (Correlated with Audience Insights)
  -- ========================================================================
  
  -- Good Campaign 1: Strong metrics, audience reach matches insights
  -- Audience: Tech Managers 25-34 (2.5M), Business Owners 35-44 (1.8M) = 4.3M total
  -- Reach: ~180K (4.2% of TAM) - realistic for $50K budget
  INSERT INTO meta_ads_metrics (campaign_id, impressions, reach, clicks, ctr, cpc, cpm, conversions, conversion_rate, cpa, roas, frequency, quality_score, spend, budget_remaining, budget_utilization)
  VALUES (good_camp1_id, 425000, 180000, 12750, 3.00, 1.18, 8.50, 510, 4.0, 29.41, 5.20, 2.36, 8.8, 15000.00, 35000.00, 30.00);

  INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
    (good_camp1_id, 'Facebook Feed', 6000.00, 170000, 5440, 218, 3.20, 1.10, 27.52, 5.50),
    (good_camp1_id, 'Instagram Feed', 4500.00, 127500, 3825, 153, 3.00, 1.18, 29.41, 5.10),
    (good_camp1_id, 'Instagram Stories', 3000.00, 85000, 2380, 95, 2.80, 1.26, 31.58, 4.80),
    (good_camp1_id, 'Facebook Video Feeds', 1500.00, 42500, 1105, 44, 2.60, 1.36, 34.09, 4.40);

  INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
    (good_camp1_id, 'pe_001', 'Product Demo Video 60s', 'Video', 150000, 4800, 192, 3.20, 1.04, 26.04, 2.1, 22, 'active'),
    (good_camp1_id, 'pe_002', 'Feature Carousel', 'Carousel', 125000, 3750, 150, 3.00, 1.07, 26.67, 2.0, 18, 'active'),
    (good_camp1_id, 'pe_003', 'Stories Swipe Up', 'Video', 85000, 2550, 102, 3.00, 1.18, 29.41, 2.4, 35, 'active'),
    (good_camp1_id, 'pe_004', 'Testimonial Static', 'Image', 65000, 1650, 66, 2.54, 1.36, 34.09, 2.8, 45, 'active');

  -- Audiences with size matching target_audience definition
  INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
    (good_camp1_id, 'Tech Managers 25-34', 2500000, 95000, 225000, 7200, 288, 3.20, 26.04, 5.80),
    (good_camp1_id, 'Business Owners 35-44', 1800000, 68000, 160000, 4480, 179, 2.80, 30.17, 4.90),
    (good_camp1_id, 'IT Decision Makers', 950000, 17000, 40000, 1070, 43, 2.68, 34.88, 4.20);

  -- Good Campaign 2: High reach, great engagement
  -- Audience: Health Conscious 25-44 (6M), Organic Food Interest (3.5M) = 9.5M
  -- Reach: 850K (8.9% of TAM) - excellent for brand awareness
  INSERT INTO meta_ads_metrics (campaign_id, impressions, reach, clicks, ctr, cpc, cpm, conversions, conversion_rate, cpa, roas, frequency, quality_score, spend, budget_remaining, budget_utilization)
  VALUES (good_camp2_id, 2800000, 850000, 50400, 1.80, 0.69, 7.85, 1512, 3.0, 23.15, 3.80, 3.29, 9.2, 35000.00, 0.00, 100.00);

  INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
    (good_camp2_id, 'Facebook Feed', 14000.00, 980000, 17640, 529, 1.80, 0.79, 26.47, 3.60),
    (good_camp2_id, 'Instagram Feed', 10500.00, 840000, 15120, 454, 1.80, 0.69, 23.13, 3.90),
    (good_camp2_id, 'Instagram Reels', 7000.00, 630000, 12600, 378, 2.00, 0.56, 18.52, 4.40),
    (good_camp2_id, 'Facebook Video', 3500.00, 350000, 5040, 151, 1.44, 0.69, 23.18, 3.50);

  INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
    (good_camp2_id, 'of_001', 'Brand Story Video 90s', 'Video', 980000, 19600, 588, 2.00, 0.56, 18.71, 3.0, 28, 'active'),
    (good_camp2_id, 'of_002', 'Ingredient Carousel', 'Carousel', 720000, 12960, 389, 1.80, 0.62, 20.57, 3.2, 32, 'active'),
    (good_camp2_id, 'of_003', 'Reels - Farm Fresh', 'Video', 630000, 11340, 340, 1.80, 0.59, 19.41, 3.1, 25, 'active'),
    (good_camp2_id, 'of_004', 'Recipe Post Static', 'Image', 470000, 6500, 195, 1.38, 0.85, 28.46, 3.5, 52, 'active');

  INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
    (good_camp2_id, 'Health Conscious 25-44', 6000000, 480000, 1600000, 32000, 960, 2.00, 18.23, 4.20),
    (good_camp2_id, 'Organic Food Interest', 3500000, 280000, 840000, 13440, 403, 1.60, 23.08, 3.50),
    (good_camp2_id, 'Sustainability Advocates', 1200000, 90000, 360000, 5040, 149, 1.40, 28.19, 3.10);

  -- Bad Campaign 1: Poor metrics, audience mismatch clear
  -- Targeting wrong age (18-24) for luxury products, budget shoppers instead of premium
  INSERT INTO meta_ads_metrics (campaign_id, impressions, reach, clicks, ctr, cpc, cpm, conversions, conversion_rate, cpa, roas, frequency, quality_score, spend, budget_remaining, budget_utilization)
  VALUES (bad_camp1_id, 380000, 145000, 2660, 0.70, 4.51, 15.80, 38, 1.4, 315.79, 0.45, 2.62, 4.2, 12000.00, 28000.00, 30.00);

  INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
    (bad_camp1_id, 'Instagram Feed', 5400.00, 171000, 1197, 17, 0.70, 4.51, 317.65, 0.42),
    (bad_camp1_id, 'Instagram Stories', 3600.00, 114000, 798, 11, 0.70, 4.51, 327.27, 0.38),
    (bad_camp1_id, 'Facebook Feed', 2400.00, 76000, 532, 8, 0.70, 4.51, 300.00, 0.52),
    (bad_camp1_id, 'Audience Network', 600.00, 19000, 133, 2, 0.70, 4.51, 300.00, 0.48);

  INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
    (bad_camp1_id, 'ls_001', 'Stock Image Ad', 'Image', 190000, 1330, 19, 0.70, 4.51, 315.79, 2.8, 68, 'fatigued'),
    (bad_camp1_id, 'ls_002', 'Generic Banner', 'Image', 190000, 1330, 19, 0.70, 4.51, 315.79, 2.5, 72, 'fatigued');

  -- Audiences show mismatch - targeting budget shoppers for luxury skincare
  INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
    (bad_camp1_id, 'Budget Beauty 18-24', 4500000, 85000, 220000, 1540, 22, 0.70, 327.27, 0.38),
    (bad_camp1_id, 'Makeup Enthusiasts 18-24', 3200000, 60000, 160000, 1120, 16, 0.70, 300.00, 0.52);

  -- Bad Campaign 2: Creative fatigue visible in metrics
  -- High frequency, declining CTR, fatigued creatives
  INSERT INTO meta_ads_metrics (campaign_id, impressions, reach, clicks, ctr, cpc, cpm, conversions, conversion_rate, cpa, roas, frequency, quality_score, spend, budget_remaining, budget_utilization)
  VALUES (bad_camp2_id, 520000, 85000, 3640, 0.70, 4.12, 11.54, 91, 2.5, 65.93, 0.85, 6.12, 3.8, 6000.00, 19000.00, 24.00);

  INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
    (bad_camp2_id, 'Facebook Feed', 2400.00, 208000, 1456, 36, 0.70, 1.65, 66.67, 0.82),
    (bad_camp2_id, 'Instagram Feed', 1800.00, 156000, 1092, 27, 0.70, 1.65, 66.67, 0.85),
    (bad_camp2_id, 'Instagram Stories', 1200.00, 104000, 728, 18, 0.70, 1.65, 66.67, 0.88),
    (bad_camp2_id, 'Facebook Video', 600.00, 52000, 364, 10, 0.70, 1.65, 60.00, 0.92);

  -- Only one creative - massively fatigued
  INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
    (bad_camp2_id, 'fa_001', 'Single Video Ad', 'Video', 520000, 3640, 91, 0.70, 1.65, 65.93, 6.12, 95, 'fatigued');

  -- Audience fatigued - shown same ad too many times
  INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
    (bad_camp2_id, 'Fitness Interest 25-44', 5800000, 62000, 380000, 2660, 66, 0.70, 68.18, 0.82),
    (bad_camp2_id, 'Gym Members', 1500000, 23000, 140000, 980, 25, 0.70, 60.00, 0.92);

  -- ========================================================================
  -- PERFORMANCE METRICS (Daily Analytics Data)
  -- ========================================================================
  
  -- Good Campaign 1: Improving daily performance (upward trend)
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, engagement_rate) VALUES
    (good_camp1_id, '2026-02-10', 'meta_ads', 38000, 1140, 46, 1350.00, 6900.00, 3.00, 1.18, 29.35, 5.11, 16000, 2.38, 0.042),
    (good_camp1_id, '2026-02-11', 'meta_ads', 42000, 1302, 52, 1500.00, 7800.00, 3.10, 1.15, 28.85, 5.20, 17500, 2.40, 0.044),
    (good_camp1_id, '2026-02-12', 'meta_ads', 45000, 1440, 58, 1650.00, 8700.00, 3.20, 1.15, 28.45, 5.27, 18800, 2.39, 0.046),
    (good_camp1_id, '2026-02-13', 'meta_ads', 48000, 1584, 65, 1750.00, 9750.00, 3.30, 1.10, 26.92, 5.57, 20000, 2.40, 0.048),
    (good_camp1_id, '2026-02-14', 'meta_ads', 52000, 1768, 72, 1850.00, 10800.00, 3.40, 1.05, 25.69, 5.84, 21500, 2.42, 0.050),
    (good_camp1_id, '2026-02-15', 'meta_ads', 55000, 1925, 79, 1950.00, 11850.00, 3.50, 1.01, 24.68, 6.08, 22800, 2.41, 0.052),
    (good_camp1_id, '2026-02-16', 'meta_ads', 58000, 2088, 86, 2050.00, 12900.00, 3.60, 0.98, 23.84, 6.29, 24000, 2.42, 0.054),
    (good_camp1_id, '2026-02-17', 'meta_ads', 62000, 2294, 94, 2150.00, 14100.00, 3.70, 0.94, 22.87, 6.56, 25500, 2.43, 0.056);

  -- Good Campaign 2: Consistent strong performance throughout (completed)
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, video_views, engagement_rate) VALUES
    (good_camp2_id, '2026-01-25', 'meta_ads', 180000, 3240, 97, 2250.00, 8730.00, 1.80, 0.69, 23.20, 3.88, 55000, 3.27, 45000, 0.035),
    (good_camp2_id, '2026-01-27', 'meta_ads', 220000, 4180, 125, 2750.00, 10625.00, 1.90, 0.66, 22.00, 3.86, 67000, 3.28, 55000, 0.038),
    (good_camp2_id, '2026-01-29', 'meta_ads', 280000, 5320, 160, 3500.00, 13600.00, 1.90, 0.66, 21.88, 3.89, 85000, 3.29, 70000, 0.039),
    (good_camp2_id, '2026-01-31', 'meta_ads', 350000, 6650, 200, 4375.00, 17000.00, 1.90, 0.66, 21.88, 3.89, 106000, 3.30, 87500, 0.040),
    (good_camp2_id, '2026-02-02', 'meta_ads', 420000, 7980, 239, 5250.00, 20315.00, 1.90, 0.66, 21.97, 3.87, 127000, 3.31, 105000, 0.041),
    (good_camp2_id, '2026-02-04', 'meta_ads', 500000, 9500, 285, 6250.00, 24225.00, 1.90, 0.66, 21.93, 3.88, 152000, 3.29, 125000, 0.042),
    (good_camp2_id, '2026-02-05', 'meta_ads', 560000, 10640, 319, 7000.00, 27115.00, 1.90, 0.66, 21.94, 3.87, 170000, 3.29, 140000, 0.042);

  -- Bad Campaign 1: Declining performance (audience mismatch showing)
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, engagement_rate) VALUES
    (bad_camp1_id, '2026-02-10', 'meta_ads', 45000, 405, 6, 1400.00, 720.00, 0.90, 3.46, 233.33, 0.51, 17000, 2.65, 0.012),
    (bad_camp1_id, '2026-02-11', 'meta_ads', 48000, 384, 5, 1500.00, 600.00, 0.80, 3.91, 300.00, 0.40, 18200, 2.64, 0.011),
    (bad_camp1_id, '2026-02-12', 'meta_ads', 52000, 390, 5, 1600.00, 600.00, 0.75, 4.10, 320.00, 0.38, 19800, 2.63, 0.010),
    (bad_camp1_id, '2026-02-13', 'meta_ads', 55000, 385, 5, 1700.00, 600.00, 0.70, 4.42, 340.00, 0.35, 21000, 2.62, 0.009),
    (bad_camp1_id, '2026-02-14', 'meta_ads', 58000, 377, 4, 1800.00, 480.00, 0.65, 4.77, 450.00, 0.27, 22100, 2.62, 0.008),
    (bad_camp1_id, '2026-02-15', 'meta_ads', 60000, 360, 4, 1900.00, 480.00, 0.60, 5.28, 475.00, 0.25, 22900, 2.62, 0.008),
    (bad_camp1_id, '2026-02-16', 'meta_ads', 62000, 341, 3, 2000.00, 360.00, 0.55, 5.87, 666.67, 0.18, 23600, 2.63, 0.007);

  -- Bad Campaign 2: Performance collapse (creative fatigue)
  INSERT INTO performance_metrics (campaign_id, metric_date, metric_source, impressions, clicks, conversions, spend, revenue, ctr, cpc, cpa, roas, reach, frequency, engagement_rate) VALUES
    (bad_camp2_id, '2026-01-31', 'meta_ads', 60000, 720, 18, 700.00, 810.00, 1.20, 0.97, 38.89, 1.16, 10000, 6.00, 0.018),
    (bad_camp2_id, '2026-02-02', 'meta_ads', 65000, 650, 14, 750.00, 630.00, 1.00, 1.15, 53.57, 0.84, 10500, 6.19, 0.015),
    (bad_camp2_id, '2026-02-04', 'meta_ads', 70000, 560, 11, 800.00, 495.00, 0.80, 1.43, 72.73, 0.62, 11000, 6.36, 0.012),
    (bad_camp2_id, '2026-02-06', 'meta_ads', 75000, 525, 9, 850.00, 405.00, 0.70, 1.62, 94.44, 0.48, 11500, 6.52, 0.010),
    (bad_camp2_id, '2026-02-08', 'meta_ads', 80000, 480, 7, 900.00, 315.00, 0.60, 1.88, 128.57, 0.35, 12000, 6.67, 0.008),
    (bad_camp2_id, '2026-02-09', 'meta_ads', 85000, 425, 5, 950.00, 225.00, 0.50, 2.24, 190.00, 0.24, 12500, 6.80, 0.006);

  RAISE NOTICE 'Comprehensive seed complete!';
  RAISE NOTICE '  Good Campaign 1: %', good_camp1_id;
  RAISE NOTICE '  Good Campaign 2: %', good_camp2_id;
  RAISE NOTICE '  Bad Campaign 1: %', bad_camp1_id;
  RAISE NOTICE '  Bad Campaign 2: %', bad_camp2_id;

END $$;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
