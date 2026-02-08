import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate dates
const getDateStr = (daysOffset: number) => {
  return format(subDays(new Date(), daysOffset), 'yyyy-MM-dd');
};

const getTimestampStr = (daysOffset: number, hour: number = 10) => {
  const date = subDays(new Date(), daysOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

async function seedDemoData() {
  console.log('🌱 Starting Kanban demo data seeding...\n');

  try {
    // Check if demo data already exists
    const { data: existingActions } = await supabase
      .from('marketer_actions')
      .select('id')
      .limit(1);

    if (existingActions && existingActions.length > 0) {
      console.log('⚠️  Demo data already exists. Skipping seed.');
      console.log('   Run this script with --force flag to re-seed (feature to be implemented).');
      return;
    }

    // Get existing campaigns or create demo campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .limit(3);

    if (campaignsError) throw campaignsError;

    if (!campaigns || campaigns.length === 0) {
      console.log('❌ No campaigns found. Please create campaigns first.');
      return;
    }

    console.log(`✅ Found ${campaigns.length} campaigns to seed with demo data.\n`);

    // Scenario 1: Creative Change Causes Sales Drop
    await seedScenario1(campaigns[0].id);

    // Scenario 2: Budget Increase Improves Performance
    if (campaigns.length > 1) {
      await seedScenario2(campaigns[1].id);
    }

    // Scenario 3: Audience Targeting - Mixed Results
    if (campaigns.length > 2) {
      await seedScenario3(campaigns[2].id);
    }

    console.log('\n✨ Kanban demo data seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Navigate to: /campaigns/[id]/kanban');
    console.log('  3. See the action tracking board with correlations!\n');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

async function seedScenario1(campaignId: string) {
  console.log('📊 Seeding Scenario 1: Creative Change Causes Sales Drop');

  // Create performance snapshots (14 days)
  const baselineMetrics = {
    sales: 500,
    roas: 3.2,
    cpa: 15.5,
    impressions: 45000,
    clicks: 1200,
    conversions: 32,
    revenue: 16000,
  };

  const performanceSnapshots = [];

  // Days 1-7: Baseline performance
  for (let i = 14; i >= 8; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        ...baselineMetrics,
        sales: baselineMetrics.sales + Math.random() * 50 - 25,
        revenue: baselineMetrics.revenue + Math.random() * 1000 - 500,
      },
      data_source: 'meta_pixel',
    });
  }

  // Day 8: Creative change happens (action at 10 AM)
  // Evening snapshot shows slight decline
  performanceSnapshots.push({
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(7),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 480,
      roas: 3.0,
      cpa: 16.2,
      impressions: 44000,
      clicks: 1150,
      conversions: 29,
      revenue: 15200,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: -4, revenue: -5 },
  });

  // Day 9: Performance drops significantly
  const droppedMetrics = {
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(6),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 200,
      roas: 1.3,
      cpa: 38.5,
      impressions: 42000,
      clicks: 980,
      conversions: 13,
      revenue: 6400,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: -58, revenue: -58 },
  };
  performanceSnapshots.push(droppedMetrics);

  // Day 10: Continues low
  performanceSnapshots.push({
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(5),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 210,
      roas: 1.4,
      cpa: 36.0,
      impressions: 41000,
      clicks: 950,
      conversions: 14,
      revenue: 6700,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: 5, revenue: 5 },
  });

  // Day 11: Revert happens (action at 9 AM)
  performanceSnapshots.push({
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(4),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 320,
      roas: 2.1,
      cpa: 24.0,
      impressions: 43000,
      clicks: 1050,
      conversions: 21,
      revenue: 10200,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: 52, revenue: 52 },
  });

  // Days 12-14: Recovery
  for (let i = 3; i >= 1; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        sales: 450 + Math.random() * 40 - 20,
        roas: 3.0 + Math.random() * 0.3,
        cpa: 16.0 + Math.random() * 2,
        impressions: 44500,
        clicks: 1180,
        conversions: 30,
        revenue: 15000 + Math.random() * 800,
      },
      data_source: 'meta_pixel',
    });
  }

  // Insert performance snapshots
  const { error: perfError } = await supabase
    .from('performance_snapshots')
    .insert(performanceSnapshots);

  if (perfError) throw perfError;
  console.log(`  ✓ Created ${performanceSnapshots.length} performance snapshots`);

  // Create marketer actions
  const creativeChangeId = uuidv4();
  const revertActionId = uuidv4();

  const actions = [
    {
      id: creativeChangeId,
      campaign_id: campaignId,
      action_type: 'creative_change',
      title: 'Changed hero image from blue to red',
      description: 'Updated main ad creative to test color psychology impact on CTR',
      timestamp: getTimestampStr(7, 10),
      metadata: {
        previous_state: { creative_url: 'blue_hero.jpg', color_scheme: 'blue' },
        new_state: { creative_url: 'red_hero.jpg', color_scheme: 'red' },
        affected_ad_sets: ['ad_set_1', 'ad_set_2'],
      },
      status: 'reverted',
      created_by: 'sarah@marketing.com',
      has_correlation: true,
      correlation_impact: 'negative',
      reverted_at: getTimestampStr(4, 9),
    },
    {
      id: uuidv4(),
      campaign_id: campaignId,
      action_type: 'budget_adjustment',
      title: 'Increased daily budget by 20%',
      description: 'Scaled budget to capture more traffic during peak season',
      timestamp: getTimestampStr(10, 14),
      metadata: {
        budget_change: { from: 1000, to: 1200, currency: 'USD' },
      },
      status: 'completed',
      created_by: 'sarah@marketing.com',
    },
    {
      id: revertActionId,
      campaign_id: campaignId,
      action_type: 'creative_change',
      title: 'Reverted: Changed hero image from blue to red',
      description: 'Reverted creative due to significant performance drop. Sales declined 60% after change.',
      timestamp: getTimestampStr(4, 9),
      metadata: {
        previous_state: { creative_url: 'red_hero.jpg', color_scheme: 'red' },
        new_state: { creative_url: 'blue_hero.jpg', color_scheme: 'blue' },
        affected_ad_sets: ['ad_set_1', 'ad_set_2'],
        reverted_from: creativeChangeId,
      },
      status: 'completed',
      created_by: 'sarah@marketing.com',
      has_correlation: true,
      correlation_impact: 'positive',
    },
  ];

  const { error: actionsError } = await supabase
    .from('marketer_actions')
    .insert(actions);

  if (actionsError) throw actionsError;
  console.log(`  ✓ Created ${actions.length} marketer actions`);

  // Create correlation
  const correlation = {
    id: uuidv4(),
    action_id: creativeChangeId,
    metric_snapshot_id: droppedMetrics.id,
    correlation_strength: 0.92,
    confidence_level: 'high',
    ai_insight:
      'Strong negative correlation detected. Sales dropped 58% within 24 hours of creative change. Conversion rate also declined significantly.',
    time_delta_hours: 14,
  };

  const { error: corrError } = await supabase
    .from('correlations')
    .insert([correlation]);

  if (corrError) throw corrError;
  console.log('  ✓ Created correlation record');

  // Create AI alert
  const alert = {
    id: uuidv4(),
    campaign_id: campaignId,
    severity: 'high',
    title: 'Sales dropped 58% after creative change',
    description:
      'Sales decreased significantly within 24 hours of changing ad creative from blue to red hero image. ROAS dropped from 3.2 to 1.3, and CPA nearly doubled.',
    detected_at: getTimestampStr(6, 8),
    correlation_data: {
      trigger_action_id: creativeChangeId,
      affected_metrics: ['sales', 'revenue', 'roas', 'cpa'],
      time_window: '24_hours',
      confidence_score: 0.92,
      metric_changes: { sales: -58, revenue: -58, roas: -59, cpa: 148 },
    },
    suggested_action: {
      type: 'revert',
      target_action_id: creativeChangeId,
      button_label: 'Revert to blue creative',
      auto_executable: true,
      description: 'Restore the previous blue hero image that showed better performance',
    },
    status: 'resolved',
    resolved_at: getTimestampStr(4, 9),
  };

  const { error: alertError } = await supabase.from('ai_alerts').insert([alert]);

  if (alertError) throw alertError;
  console.log('  ✓ Created AI alert\n');
}

async function seedScenario2(campaignId: string) {
  console.log('📊 Seeding Scenario 2: Budget Increase Improves Performance');

  const baselineMetrics = {
    sales: 320,
    roas: 2.8,
    cpa: 22.5,
    impressions: 28000,
    clicks: 850,
    conversions: 19,
    revenue: 9600,
  };

  const performanceSnapshots = [];

  // Days 1-4: Baseline
  for (let i = 10; i >= 7; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        ...baselineMetrics,
        sales: baselineMetrics.sales + Math.random() * 30 - 15,
        revenue: baselineMetrics.revenue + Math.random() * 500 - 250,
      },
      data_source: 'meta_pixel',
    });
  }

  // Day 5: Budget increase happens
  performanceSnapshots.push({
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(6),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 380,
      roas: 3.1,
      cpa: 20.5,
      impressions: 35000,
      clicks: 1050,
      conversions: 24,
      revenue: 11400,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: 19, revenue: 19 },
  });

  // Days 6-7: Continued improvement
  const improvedMetrics = {
    id: uuidv4(),
    campaign_id: campaignId,
    date: getDateStr(5),
    snapshot_time: '23:59:59',
    metrics: {
      sales: 520,
      roas: 3.5,
      cpa: 18.0,
      impressions: 42000,
      clicks: 1300,
      conversions: 34,
      revenue: 15600,
    },
    data_source: 'meta_pixel',
    change_from_previous_day: { sales: 37, revenue: 37 },
  };
  performanceSnapshots.push(improvedMetrics);

  for (let i = 4; i >= 1; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        sales: 500 + Math.random() * 50,
        roas: 3.4 + Math.random() * 0.2,
        cpa: 18.5 + Math.random() * 1.5,
        impressions: 41000,
        clicks: 1280,
        conversions: 33,
        revenue: 15200 + Math.random() * 800,
      },
      data_source: 'meta_pixel',
    });
  }

  const { error: perfError } = await supabase
    .from('performance_snapshots')
    .insert(performanceSnapshots);

  if (perfError) throw perfError;
  console.log(`  ✓ Created ${performanceSnapshots.length} performance snapshots`);

  // Create actions
  const budgetIncreaseId = uuidv4();
  const actions = [
    {
      id: budgetIncreaseId,
      campaign_id: campaignId,
      action_type: 'budget_adjustment',
      title: 'Increased daily budget by 40%',
      description: 'Scaled budget after seeing strong early performance metrics',
      timestamp: getTimestampStr(6, 11),
      metadata: {
        budget_change: { from: 800, to: 1120, currency: 'USD' },
      },
      status: 'completed',
      created_by: 'mike@marketing.com',
      has_correlation: true,
      correlation_impact: 'positive',
    },
    {
      id: uuidv4(),
      campaign_id: campaignId,
      action_type: 'audience_targeting',
      title: 'Expanded to lookalike audiences',
      description: 'Added 3% lookalike audience based on existing customers',
      timestamp: getTimestampStr(8, 15),
      metadata: {
        targeting_change: {
          added: ['lookalike_3pct_customers'],
        },
      },
      status: 'completed',
      created_by: 'mike@marketing.com',
    },
  ];

  const { error: actionsError } = await supabase
    .from('marketer_actions')
    .insert(actions);

  if (actionsError) throw actionsError;
  console.log(`  ✓ Created ${actions.length} marketer actions`);

  // Create correlation
  const correlation = {
    id: uuidv4(),
    action_id: budgetIncreaseId,
    metric_snapshot_id: improvedMetrics.id,
    correlation_strength: 0.87,
    confidence_level: 'high',
    ai_insight:
      'Positive correlation detected. Sales increased 62% within 48 hours of budget increase. ROAS improved from 2.8 to 3.5.',
    time_delta_hours: 24,
  };

  const { error: corrError } = await supabase
    .from('correlations')
    .insert([correlation]);

  if (corrError) throw corrError;
  console.log('  ✓ Created correlation record');

  // Create AI alert (active - suggesting to maintain)
  const alert = {
    id: uuidv4(),
    campaign_id: campaignId,
    severity: 'medium',
    title: 'Budget increase driving strong performance',
    description:
      'Sales increased 62% after budget scaling. Campaign is efficiently utilizing additional spend with improved ROAS.',
    detected_at: getTimestampStr(4, 9),
    correlation_data: {
      trigger_action_id: budgetIncreaseId,
      affected_metrics: ['sales', 'revenue', 'roas'],
      time_window: '48_hours',
      confidence_score: 0.87,
      metric_changes: { sales: 62, revenue: 62, roas: 25 },
    },
    suggested_action: {
      type: 'monitor',
      button_label: 'Continue monitoring',
      auto_executable: false,
      description: 'Keep current budget level and monitor for sustained performance',
    },
    status: 'active',
  };

  const { error: alertError } = await supabase.from('ai_alerts').insert([alert]);

  if (alertError) throw alertError;
  console.log('  ✓ Created AI alert\n');
}

async function seedScenario3(campaignId: string) {
  console.log('📊 Seeding Scenario 3: Audience Targeting Mixed Results');

  const baselineMetrics = {
    sales: 420,
    roas: 3.0,
    cpa: 19.0,
    impressions: 38000,
    clicks: 1100,
    conversions: 27,
    revenue: 12600,
  };

  const performanceSnapshots = [];

  // Days 1-5: Baseline
  for (let i = 8; i >= 4; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        ...baselineMetrics,
        sales: baselineMetrics.sales + Math.random() * 40 - 20,
        revenue: baselineMetrics.revenue + Math.random() * 600 - 300,
      },
      data_source: 'meta_pixel',
    });
  }

  // Day 6: Targeting change happens
  for (let i = 3; i >= 1; i--) {
    performanceSnapshots.push({
      id: uuidv4(),
      campaign_id: campaignId,
      date: getDateStr(i),
      snapshot_time: '23:59:59',
      metrics: {
        sales: 410 + Math.random() * 40 - 20,
        roas: 2.95 + Math.random() * 0.15,
        cpa: 19.5 + Math.random() * 1.5,
        impressions: 41000,
        clicks: 1250,
        conversions: 26,
        revenue: 12300 + Math.random() * 500,
      },
      data_source: 'meta_pixel',
    });
  }

  const { error: perfError } = await supabase
    .from('performance_snapshots')
    .insert(performanceSnapshots);

  if (perfError) throw perfError;
  console.log(`  ✓ Created ${performanceSnapshots.length} performance snapshots`);

  // Create actions
  const actions = [
    {
      id: uuidv4(),
      campaign_id: campaignId,
      action_type: 'audience_targeting',
      title: 'Changed age targeting to 25-45',
      description: 'Narrowed age range based on initial analytics',
      timestamp: getTimestampStr(3, 13),
      metadata: {
        targeting_change: {
          previous: { age_min: 18, age_max: 65 },
          new: { age_min: 25, age_max: 45 },
        },
      },
      status: 'completed',
      created_by: 'emily@marketing.com',
    },
    {
      id: uuidv4(),
      campaign_id: campaignId,
      action_type: 'ad_copy_update',
      title: 'Updated CTA from "Learn More" to "Shop Now"',
      description: 'Testing more direct call-to-action',
      timestamp: getTimestampStr(5, 10),
      metadata: {
        previous_state: { cta_text: 'Learn More' },
        new_state: { cta_text: 'Shop Now' },
      },
      status: 'completed',
      created_by: 'emily@marketing.com',
    },
    {
      id: uuidv4(),
      campaign_id: campaignId,
      action_type: 'bidding_strategy',
      title: 'Switched to cost cap bidding',
      description: 'Changed from lowest cost to cost cap at $20 CPA target',
      timestamp: getTimestampStr(6, 16),
      metadata: {
        previous_state: { strategy: 'lowest_cost' },
        new_state: { strategy: 'cost_cap', target_cpa: 20 },
      },
      status: 'in_progress',
      created_by: 'emily@marketing.com',
    },
  ];

  const { error: actionsError } = await supabase
    .from('marketer_actions')
    .insert(actions);

  if (actionsError) throw actionsError;
  console.log(`  ✓ Created ${actions.length} marketer actions\n`);
}

// Run the seeding
seedDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
