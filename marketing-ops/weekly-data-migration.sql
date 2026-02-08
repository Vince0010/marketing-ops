-- ============================================================================
-- WEEKLY DATA REPORTS TABLE MIGRATION
-- ============================================================================
-- This adds the weekly_data_reports table for storing aggregated weekly
-- performance data from various sources (Facebook, Instagram, etc.)
-- ============================================================================

-- Create the weekly_data_reports table
CREATE TABLE IF NOT EXISTS weekly_data_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  week_starting DATE NOT NULL,
  week_ending DATE NOT NULL,
  
  -- Platform metrics
  facebook_views INTEGER DEFAULT 0,
  instagram_views INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  
  -- Engagement
  total_engagement INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,4) DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Sales/Revenue
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0,
  
  -- Cost
  total_spend NUMERIC(12,2) DEFAULT 0,
  cpc NUMERIC(8,2),
  cpa NUMERIC(8,2),
  roas NUMERIC(6,2),
  
  -- Week-over-week changes
  sales_change_pct NUMERIC(6,2),
  engagement_change_pct NUMERIC(6,2),
  views_change_pct NUMERIC(6,2),
  
  -- Metadata
  notes TEXT,
  data_source TEXT DEFAULT 'mock'
);

-- Create index for faster campaign lookups
CREATE INDEX IF NOT EXISTS idx_weekly_data_reports_campaign 
  ON weekly_data_reports(campaign_id, week_starting DESC);

-- ============================================================================
-- SEED MOCK DATA FOR EXISTING CAMPAIGNS
-- ============================================================================
-- Insert sample weekly data showing performance fluctuations that correlate
-- with task events (delays, completions) from the seed data campaigns.

DO $$
DECLARE
  camp1_id UUID; -- TechStart Q1 Lead Generation
  camp2_id UUID; -- FitGear Summer Sale Blitz
  camp5_id UUID; -- SpringStyle Fashion Collection Launch
BEGIN
  -- Get campaign IDs
  SELECT id INTO camp1_id FROM campaigns WHERE name = 'TechStart Q1 Lead Generation' LIMIT 1;
  SELECT id INTO camp2_id FROM campaigns WHERE name = 'FitGear Summer Sale Blitz' LIMIT 1;
  SELECT id INTO camp5_id FROM campaigns WHERE name = 'SpringStyle Fashion Collection Launch' LIMIT 1;

  -- Skip if campaigns don't exist
  IF camp1_id IS NULL THEN
    RAISE NOTICE 'No campaigns found, skipping weekly data seeding';
    RETURN;
  END IF;

  -- Clear existing weekly data
  DELETE FROM weekly_data_reports WHERE campaign_id IN (camp1_id, camp2_id, camp5_id);

  -- ========================================================================
  -- CAMPAIGN 1: TechStart Q1 Lead Generation (Successful Campaign)
  -- Shows steady growth with positive spike during optimization phase
  -- ========================================================================
  INSERT INTO weekly_data_reports (
    campaign_id, week_starting, week_ending,
    facebook_views, instagram_views, total_impressions, total_reach,
    total_engagement, engagement_rate, likes, comments, shares,
    total_sales, total_revenue, conversion_count, conversion_rate,
    total_spend, cpc, cpa, roas,
    sales_change_pct, engagement_change_pct, views_change_pct,
    notes
  ) VALUES
    -- Week 1: Launch week - baseline
    (camp1_id, '2026-01-20', '2026-01-26',
     18000, 12000, 45000, 38500,
     1890, 0.042, 1200, 350, 340,
     54, 3150.00, 54, 0.0012,
     750.00, 0.56, 13.89, 4.20,
     NULL, NULL, NULL,
     'Launch week - establishing baseline performance'),
    
    -- Week 2: Optimization kicks in - strong improvement
    (camp1_id, '2026-01-27', '2026-02-02',
     25000, 18000, 68000, 55000,
     3535, 0.052, 2200, 680, 655,
     105, 6300.00, 105, 0.0015,
     1100.00, 0.46, 10.48, 5.73,
     94.4, 87.0, 43.3,
     'Optimization phase - early creative testing identified winner, performance spiked'),
    
    -- Week 3: Reporting phase - continued strong performance
    (camp1_id, '2026-02-03', '2026-02-09',
     22000, 16000, 62000, 50000,
     3100, 0.050, 1950, 590, 560,
     98, 5880.00, 98, 0.0016,
     980.00, 0.42, 10.00, 6.00,
     -6.7, -12.3, -8.8,
     'Campaign winding down - maintained strong ROAS');

  -- ========================================================================
  -- CAMPAIGN 2: FitGear Summer Sale Blitz (Positive Drift Success)
  -- Shows early momentum from compressed timeline
  -- ========================================================================
  IF camp2_id IS NOT NULL THEN
    INSERT INTO weekly_data_reports (
      campaign_id, week_starting, week_ending,
      facebook_views, instagram_views, total_impressions, total_reach,
      total_engagement, engagement_rate, likes, comments, shares,
      total_sales, total_revenue, conversion_count, conversion_rate,
      total_spend, cpc, cpa, roas,
      sales_change_pct, engagement_change_pct, views_change_pct,
      notes
    ) VALUES
      -- Week 1: Early launch (3 days ahead of schedule)
      (camp2_id, '2026-01-20', '2026-01-26',
       32000, 28000, 85000, 72000,
       5100, 0.060, 3200, 980, 920,
       145, 14500.00, 145, 0.0017,
       1250.00, 0.48, 8.62, 11.60,
       NULL, NULL, NULL,
       'Early launch - captured market before competitors'),
      
      -- Week 2: Peak momentum
      (camp2_id, '2026-01-27', '2026-02-02',
       45000, 38000, 115000, 95000,
       7360, 0.064, 4600, 1420, 1340,
       210, 21000.00, 210, 0.0018,
       1680.00, 0.44, 8.00, 12.50,
       44.8, 44.3, 38.3,
       'Peak performance - summer fitness trend at height'),
      
      -- Week 3: Sustained high performance
      (camp2_id, '2026-02-03', '2026-02-09',
       40000, 35000, 105000, 88000,
       6720, 0.064, 4200, 1300, 1220,
       195, 19500.00, 195, 0.0019,
       1550.00, 0.45, 7.95, 12.58,
       -7.1, -8.7, -9.6,
       'Post-peak - maintained strong ROAS as sale winds down');
  END IF;

  -- ========================================================================
  -- CAMPAIGN 5: SpringStyle Fashion Collection (Accountability Example)
  -- Shows negative impact from client delays
  -- ========================================================================
  IF camp5_id IS NOT NULL THEN
    INSERT INTO weekly_data_reports (
      campaign_id, week_starting, week_ending,
      facebook_views, instagram_views, total_impressions, total_reach,
      total_engagement, engagement_rate, likes, comments, shares,
      total_sales, total_revenue, conversion_count, conversion_rate,
      total_spend, cpc, cpa, roas,
      sales_change_pct, engagement_change_pct, views_change_pct,
      notes
    ) VALUES
      -- Week 1: Pre-launch preparation (should have launched)
      (camp5_id, '2026-02-03', '2026-02-09',
       5000, 3500, 12000, 10000,
       400, 0.033, 250, 80, 70,
       8, 640.00, 8, 0.0007,
       150.00, 1.25, 18.75, 4.27,
       NULL, NULL, NULL,
       'Pre-launch organic only - waiting on creative approval due to client delays'),
      
      -- Week 2: Still delayed (should be in optimization by now)
      (camp5_id, '2026-02-10', '2026-02-16',
       3200, 2100, 8000, 6500,
       280, 0.035, 175, 55, 50,
       5, 400.00, 5, 0.0006,
       80.00, 1.50, 16.00, 5.00,
       -37.5, -30.0, -37.6,
       'Campaign still not launched - client product feed delivery blocking setup. Competitors capturing spring fashion audience.'),
      
      -- Week 3: Late launch impact (4 days behind schedule)
      (camp5_id, '2026-02-17', '2026-02-23',
       18000, 14000, 48000, 40000,
       1920, 0.040, 1200, 370, 350,
       42, 3360.00, 42, 0.0009,
       720.00, 0.85, 17.14, 4.67,
       740.0, 585.7, 500.0,
       'Finally launched - strong initial response but lost 4 days of peak spring shopping window');
  END IF;

  RAISE NOTICE 'Weekly data reports seeded successfully';
END $$;
