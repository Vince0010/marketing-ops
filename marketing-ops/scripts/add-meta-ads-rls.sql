-- ============================================================================
-- Add RLS Policies for Meta Ads Tables
-- ============================================================================
-- Enables public read access to meta ads tables (same as other campaign data)
-- ============================================================================

-- Enable RLS on all meta ads tables
ALTER TABLE meta_ads_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_audiences ENABLE ROW LEVEL SECURITY;

-- Create policies for meta_ads_metrics
CREATE POLICY "Allow public read access" ON meta_ads_metrics
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON meta_ads_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON meta_ads_metrics
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON meta_ads_metrics
  FOR DELETE USING (true);

-- Create policies for meta_ads_placements
CREATE POLICY "Allow public read access" ON meta_ads_placements
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON meta_ads_placements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON meta_ads_placements
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON meta_ads_placements
  FOR DELETE USING (true);

-- Create policies for meta_ads_creatives
CREATE POLICY "Allow public read access" ON meta_ads_creatives
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON meta_ads_creatives
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON meta_ads_creatives
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON meta_ads_creatives
  FOR DELETE USING (true);

-- Create policies for meta_ads_audiences
CREATE POLICY "Allow public read access" ON meta_ads_audiences
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON meta_ads_audiences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON meta_ads_audiences
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON meta_ads_audiences
  FOR DELETE USING (true);
