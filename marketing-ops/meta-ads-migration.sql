-- ============================================================================
-- META ADS DATABASE TABLES MIGRATION
-- ============================================================================
-- Creates tables for storing Meta Ads performance data that can be displayed
-- in the MetaAdsDashboard component instead of generated mock data.
-- ============================================================================

-- Overall campaign metrics
CREATE TABLE IF NOT EXISTS meta_ads_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  cpm NUMERIC(10,2) DEFAULT 0,
  
  -- Conversions
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(6,2) DEFAULT 0,
  
  -- Engagement
  frequency NUMERIC(5,2) DEFAULT 0,
  quality_score NUMERIC(4,2) DEFAULT 0,
  
  -- Budget
  spend NUMERIC(12,2) DEFAULT 0,
  budget_remaining NUMERIC(12,2) DEFAULT 0,
  budget_utilization NUMERIC(5,2) DEFAULT 0
);

-- Performance by placement
CREATE TABLE IF NOT EXISTS meta_ads_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  placement TEXT NOT NULL,
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(6,2) DEFAULT 0
);

-- Creative performance with fatigue tracking
CREATE TABLE IF NOT EXISTS meta_ads_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  creative_id TEXT NOT NULL,
  creative_name TEXT NOT NULL,
  format TEXT NOT NULL, -- 'Video', 'Image', 'Carousel'
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  frequency NUMERIC(5,2) DEFAULT 0,
  fatigue_score INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fatigued', 'paused'))
);

-- Audience segment performance
CREATE TABLE IF NOT EXISTS meta_ads_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  segment TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC(5,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(6,2) DEFAULT 0
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_meta_ads_metrics_campaign ON meta_ads_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_placements_campaign ON meta_ads_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_creatives_campaign ON meta_ads_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_audiences_campaign ON meta_ads_audiences(campaign_id);

-- ============================================================================
-- SEED DATA FOR EXISTING CAMPAIGNS
-- ============================================================================

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

  IF camp1_id IS NULL THEN
    RAISE NOTICE 'No campaigns found, skipping Meta Ads seeding';
    RETURN;
  END IF;

  -- Clear existing data
  DELETE FROM meta_ads_metrics WHERE campaign_id IN (camp1_id, camp2_id, camp5_id);
  DELETE FROM meta_ads_placements WHERE campaign_id IN (camp1_id, camp2_id, camp5_id);
  DELETE FROM meta_ads_creatives WHERE campaign_id IN (camp1_id, camp2_id, camp5_id);
  DELETE FROM meta_ads_audiences WHERE campaign_id IN (camp1_id, camp2_id, camp5_id);

  -- ========================================================================
  -- CAMPAIGN 1: TechStart Q1 Lead Generation (Strong Performer)
  -- ========================================================================
  
  -- Overall Metrics
  INSERT INTO meta_ads_metrics (
    campaign_id, impressions, reach, clicks, ctr, cpc, cpm,
    conversions, conversion_rate, cpa, roas, frequency, quality_score,
    spend, budget_remaining, budget_utilization
  ) VALUES (
    camp1_id, 67145, 52000, 1130, 2.85, 1.95, 9.20,
    174, 15.4, 32.50, 4.35, 2.1, 8.5,
    5650.00, 4350.00, 56.50
  );

  -- Placements
  INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
    (camp1_id, 'Facebook Feed', 2840.50, 24125, 512, 87, 2.12, 5.55, 32.65, 4.2),
    (camp1_id, 'Instagram Feed', 1890.25, 18650, 331, 51, 1.77, 5.71, 37.06, 3.8),
    (camp1_id, 'Instagram Stories', 1120.75, 15420, 198, 24, 1.28, 5.66, 46.70, 2.9),
    (camp1_id, 'Facebook Right Column', 675.80, 8950, 89, 12, 0.99, 7.59, 56.32, 2.1);

  -- Creatives
  INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
    (camp1_id, 'cr_001', 'Video A - Product Demo', 'Video', 18920, 402, 68, 2.12, 5.20, 30.76, 3.2, 75, 'active'),
    (camp1_id, 'cr_002', 'Carousel B - Features', 'Carousel', 15440, 289, 45, 1.87, 6.10, 38.09, 2.8, 45, 'active'),
    (camp1_id, 'cr_003', 'Single Image C - Testimonial', 'Image', 12350, 185, 22, 1.50, 7.20, 60.45, 4.8, 92, 'fatigued'),
    (camp1_id, 'cr_004', 'Video D - Customer Success', 'Video', 9840, 156, 18, 1.58, 6.80, 59.11, 2.1, 25, 'active');

  -- Audiences
  INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
    (camp1_id, 'Tech Managers 25-34', 2500000, 125000, 18920, 402, 89, 2.12, 28.50, 4.8),
    (camp1_id, 'Business Owners 35-44', 1800000, 98000, 15440, 289, 52, 1.87, 35.20, 3.9),
    (camp1_id, 'IT Decision Makers 45-54', 950000, 72000, 12350, 185, 31, 1.50, 42.80, 3.1),
    (camp1_id, 'Startup Founders 25-40', 650000, 45000, 9840, 156, 28, 1.58, 38.90, 3.6);

  -- ========================================================================
  -- CAMPAIGN 2: FitGear Summer Sale Blitz (High-Performance E-commerce)
  -- ========================================================================
  IF camp2_id IS NOT NULL THEN
    INSERT INTO meta_ads_metrics (
      campaign_id, impressions, reach, clicks, ctr, cpc, cpm,
      conversions, conversion_rate, cpa, roas, frequency, quality_score,
      spend, budget_remaining, budget_utilization
    ) VALUES (
      camp2_id, 305000, 255000, 5480, 1.80, 0.82, 7.85,
      550, 10.0, 8.18, 12.2, 1.8, 9.2,
      4500.00, 10500.00, 30.00
    );

    INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
      (camp2_id, 'Facebook Feed', 1800.00, 98000, 1960, 220, 2.00, 0.92, 8.18, 12.5),
      (camp2_id, 'Instagram Feed', 1350.00, 88000, 1584, 165, 1.80, 0.85, 8.18, 12.8),
      (camp2_id, 'Instagram Stories', 900.00, 78000, 1248, 110, 1.60, 0.72, 8.18, 11.5),
      (camp2_id, 'Facebook Reels', 450.00, 41000, 688, 55, 1.68, 0.65, 8.18, 10.8);

    INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
      (camp2_id, 'fg_001', 'Summer Sale Hero Video', 'Video', 125000, 2500, 280, 2.00, 0.72, 6.43, 1.6, 20, 'active'),
      (camp2_id, 'fg_002', 'Product Carousel - Top Sellers', 'Carousel', 95000, 1710, 160, 1.80, 0.79, 8.44, 1.5, 15, 'active'),
      (camp2_id, 'fg_003', 'Influencer UGC Compilation', 'Video', 55000, 825, 72, 1.50, 0.91, 10.42, 1.8, 35, 'active'),
      (camp2_id, 'fg_004', 'Flash Sale Banner', 'Image', 30000, 445, 38, 1.48, 1.01, 11.84, 2.2, 55, 'active');

    INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
      (camp2_id, 'Fitness Enthusiasts 18-35', 5500000, 180000, 125000, 2500, 275, 2.00, 6.55, 14.2),
      (camp2_id, 'Gym Members 25-44', 3200000, 98000, 85000, 1360, 140, 1.60, 8.21, 11.8),
      (camp2_id, 'Sports Shoppers - Past Buyers', 450000, 42000, 55000, 990, 95, 1.80, 7.37, 13.5),
      (camp2_id, 'Health & Wellness Interest', 8200000, 125000, 40000, 630, 40, 1.58, 11.25, 8.9);
  END IF;

  -- ========================================================================
  -- CAMPAIGN 5: SpringStyle Fashion (Struggling - Delayed Launch Impact)
  -- ========================================================================
  IF camp5_id IS NOT NULL THEN
    INSERT INTO meta_ads_metrics (
      campaign_id, impressions, reach, clicks, ctr, cpc, cpm,
      conversions, conversion_rate, cpa, roas, frequency, quality_score,
      spend, budget_remaining, budget_utilization
    ) VALUES (
      camp5_id, 48000, 40000, 720, 1.50, 2.78, 11.25,
      55, 7.6, 36.36, 2.4, 1.4, 6.2,
      2000.00, 6000.00, 25.00
    );

    INSERT INTO meta_ads_placements (campaign_id, placement, spend, impressions, clicks, conversions, ctr, cpc, cpa, roas) VALUES
      (camp5_id, 'Instagram Feed', 950.00, 22000, 374, 32, 1.70, 2.54, 29.69, 2.8),
      (camp5_id, 'Instagram Stories', 580.00, 15000, 210, 14, 1.40, 2.76, 41.43, 2.1),
      (camp5_id, 'Facebook Feed', 320.00, 8000, 104, 7, 1.30, 3.08, 45.71, 1.8),
      (camp5_id, 'Pinterest', 150.00, 3000, 32, 2, 1.07, 4.69, 75.00, 1.2);

    INSERT INTO meta_ads_creatives (campaign_id, creative_id, creative_name, format, impressions, clicks, conversions, ctr, cpc, cpa, frequency, fatigue_score, status) VALUES
      (camp5_id, 'ss_001', 'Spring Collection Lookbook', 'Carousel', 18000, 288, 25, 1.60, 2.43, 28.00, 1.3, 18, 'active'),
      (camp5_id, 'ss_002', 'New Arrivals Video', 'Video', 15000, 240, 18, 1.60, 2.50, 33.33, 1.2, 12, 'active'),
      (camp5_id, 'ss_003', 'Sale Banner Static', 'Image', 10000, 130, 8, 1.30, 3.08, 50.00, 1.5, 40, 'active'),
      (camp5_id, 'ss_004', 'Behind the Scenes', 'Video', 5000, 62, 4, 1.24, 3.23, 50.00, 1.6, 28, 'active');

    INSERT INTO meta_ads_audiences (campaign_id, segment, size, reach, impressions, clicks, conversions, ctr, cpa, roas) VALUES
      (camp5_id, 'Fashion Forward Women 25-44', 4200000, 85000, 22000, 374, 28, 1.70, 30.36, 2.8),
      (camp5_id, 'Spring Shoppers', 2100000, 65000, 15000, 210, 15, 1.40, 38.67, 2.2),
      (camp5_id, 'Sustainable Fashion Interest', 980000, 42000, 8000, 104, 9, 1.30, 35.56, 2.4),
      (camp5_id, 'Competitor Audiences', 650000, 28000, 3000, 32, 3, 1.07, 50.00, 1.5);
  END IF;

  RAISE NOTICE 'Meta Ads data seeded successfully';
END $$;
