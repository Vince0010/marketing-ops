import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xktszgxqtkcpewmhxbhj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdHN6Z3hxdGtjcGV3bWh4YmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ0NzUyMSwiZXhwIjoyMDg2MDIzNTIxfQ.LpGC2j66WHjU8iXxDiVR9yK6TM2R-E0UBIBzDmyBgbY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addRLSPolicies() {
  console.log('Adding RLS policies to meta ads tables...')
  
  const sqlStatements = [
    // Enable RLS
    'ALTER TABLE meta_ads_metrics ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE meta_ads_placements ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE meta_ads_creatives ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE meta_ads_audiences ENABLE ROW LEVEL SECURITY',
    
    // Policies for meta_ads_metrics
    'CREATE POLICY "Allow public read access" ON meta_ads_metrics FOR SELECT USING (true)',
    'CREATE POLICY "Allow public insert access" ON meta_ads_metrics FOR INSERT WITH CHECK (true)',
    'CREATE POLICY "Allow public update access" ON meta_ads_metrics FOR UPDATE USING (true)',
    'CREATE POLICY "Allow public delete access" ON meta_ads_metrics FOR DELETE USING (true)',
    
    // Policies for meta_ads_placements
    'CREATE POLICY "Allow public read access" ON meta_ads_placements FOR SELECT USING (true)',
    'CREATE POLICY "Allow public insert access" ON meta_ads_placements FOR INSERT WITH CHECK (true)',
    'CREATE POLICY "Allow public update access" ON meta_ads_placements FOR UPDATE USING (true)',
    'CREATE POLICY "Allow public delete access" ON meta_ads_placements FOR DELETE USING (true)',
    
    // Policies for meta_ads_creatives
    'CREATE POLICY "Allow public read access" ON meta_ads_creatives FOR SELECT USING (true)',
    'CREATE POLICY "Allow public insert access" ON meta_ads_creatives FOR INSERT WITH CHECK (true)',
    'CREATE POLICY "Allow public update access" ON meta_ads_creatives FOR UPDATE USING (true)',
    'CREATE POLICY "Allow public delete access" ON meta_ads_creatives FOR DELETE USING (true)',
    
    // Policies for meta_ads_audiences
    'CREATE POLICY "Allow public read access" ON meta_ads_audiences FOR SELECT USING (true)',
    'CREATE POLICY "Allow public insert access" ON meta_ads_audiences FOR INSERT WITH CHECK (true)',
    'CREATE POLICY "Allow public update access" ON meta_ads_audiences FOR UPDATE USING (true)',
    'CREATE POLICY "Allow public delete access" ON meta_ads_audiences FOR DELETE USING (true)',
  ]
  
  for (const sql of sqlStatements) {
    console.log(`Executing: ${sql}`)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.error(`Error: ${error.message}`)
    } else {
      console.log('✓ Success')
    }
  }
  
  console.log('\nDone!')
}

addRLSPolicies().catch(console.error)
