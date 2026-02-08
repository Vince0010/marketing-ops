import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { subDays, addHours, format } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate timestamps
const getTimestamp = (daysAgo: number, hoursOffset: number = 0) => {
  const date = subDays(new Date(), daysAgo);
  return addHours(date, hoursOffset).toISOString();
};

// Sample tasks categorized by phase
const PHASE_TASKS = {
  planning: [
    {
      title: 'Define target audience segments',
      description: 'Research and create 3-5 audience personas',
      action_type: 'audience_targeting',
      estimated_time_hours: 4,
      actual_time_hours: 5,
      created_by: 'sarah@marketing.com',
    },
    {
      title: 'Research competitor campaigns',
      description: 'Analyze 5 competitor campaigns and document findings',
      action_type: 'other',
      estimated_time_hours: 3,
      actual_time_hours: 2.5,
      created_by: 'mike@marketing.com',
    },
    {
      title: 'Set campaign KPIs and benchmarks',
      description: 'Define success metrics and target values',
      action_type: 'other',
      estimated_time_hours: 2,
      actual_time_hours: 2,
      created_by: 'sarah@marketing.com',
    },
  ],
  creative: [
    {
      title: 'Design ad variations (Set A)',
      description: 'Create 3 variations of hero image ads',
      action_type: 'creative_change',
      estimated_time_hours: 8,
      actual_time_hours: 12,
      created_by: 'design@marketing.com',
    },
    {
      title: 'Write ad copy for all variants',
      description: '15 headlines and 10 body copy options',
      action_type: 'ad_copy_update',
      estimated_time_hours: 4,
      actual_time_hours: 6,
      created_by: 'copywriter@marketing.com',
    },
    {
      title: 'Create video ads (30s)',
      description: 'Produce 2 video ad variants',
      action_type: 'creative_change',
      estimated_time_hours: 16,
      actual_time_hours: 14,
      created_by: 'video@marketing.com',
    },
    {
      title: 'Design carousel ads',
      description: '5-card carousel showcasing product features',
      action_type: 'creative_change',
      estimated_time_hours: 6,
      actual_time_hours: 8,
      created_by: 'design@marketing.com',
    },
  ],
  compliance: [
    {
      title: 'Legal review of ad claims',
      description: 'Submit all copy for legal compliance check',
      action_type: 'other',
      estimated_time_hours: 2,
      actual_time_hours: 4,
      created_by: 'sarah@marketing.com',
    },
    {
      title: 'Update privacy policy references',
      description: 'Ensure GDPR/CCPA compliance in ad copy',
      action_type: 'ad_copy_update',
      estimated_time_hours: 1,
      actual_time_hours: 2,
      created_by: 'legal@marketing.com',
    },
  ],
  setup: [
    {
      title: 'Configure Meta Ads Manager campaigns',
      description: 'Set up 3 campaign structures with proper naming',
      action_type: 'other',
      estimated_time_hours: 3,
      actual_time_hours: 2,
      created_by: 'mike@marketing.com',
    },
    {
      title: 'Set up conversion tracking pixels',
      description: 'Install and test FB pixel, Google Analytics',
      action_type: 'other',
      estimated_time_hours: 2,
      actual_time_hours: 3,
      created_by: 'tech@marketing.com',
    },
    {
      title: 'Configure audience targeting parameters',
      description: 'Set up lookalike audiences and interest targeting',
      action_type: 'audience_targeting',
      estimated_time_hours: 2,
      actual_time_hours: 1.5,
      created_by: 'mike@marketing.com',
    },
  ],
  launch: [
    {
      title: 'Review and approve final creative',
      description: 'Final stakeholder sign-off on all assets',
      action_type: 'other',
      estimated_time_hours: 1,
      actual_time_hours: 1,
      created_by: 'sarah@marketing.com',
    },
    {
      title: 'Launch campaign to 20% budget',
      description: 'Soft launch with reduced budget for testing',
      action_type: 'budget_adjustment',
      estimated_time_hours: 0.5,
      actual_time_hours: 0.5,
      created_by: 'mike@marketing.com',
    },
  ],
  optimization: [
    {
      title: 'Monitor early performance metrics',
      description: 'Check first 48 hours of performance data',
      action_type: 'other',
      estimated_time_hours: 2,
      actual_time_hours: 1.5,
      created_by: 'mike@marketing.com',
    },
    {
      title: 'Pause underperforming ad variants',
      description: 'Turn off ads with CTR < 1%',
      action_type: 'other',
      estimated_time_hours: 1,
      actual_time_hours: 1,
      created_by: 'mike@marketing.com',
    },
    {
      title: 'Increase budget on winning ad sets',
      description: 'Scale budget by 50% on top performers',
      action_type: 'budget_adjustment',
      estimated_time_hours: 0.5,
      actual_time_hours: 0.5,
      created_by: 'sarah@marketing.com',
    },
    {
      title: 'A/B test new headline variants',
      description: 'Launch 3 new headline tests',
      action_type: 'ad_copy_update',
      estimated_time_hours: 2,
      actual_time_hours: 2.5,
      created_by: 'copywriter@marketing.com',
    },
  ],
  reporting: [
    {
      title: 'Compile week 1 performance report',
      description: 'Analyze metrics and create stakeholder deck',
      action_type: 'other',
      estimated_time_hours: 4,
      actual_time_hours: 4,
      created_by: 'sarah@marketing.com',
    },
    {
      title: 'Document lessons learned',
      description: 'Create case study for internal knowledge base',
      action_type: 'other',
      estimated_time_hours: 2,
      actual_time_hours: 2,
      created_by: 'sarah@marketing.com',
    },
  ],
};

async function seedPhaseBasedTasks() {
  console.log('🌱 Starting phase-based task data seeding...\n');

  try {
    // Get first campaign
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .limit(1)
      .single();

    if (campaignsError) throw campaignsError;

    if (!campaigns) {
      console.log('❌ No campaigns found. Please create a campaign first.');
      return;
    }

    const campaignId = campaigns.id;
    console.log(`✅ Found campaign: ${campaigns.name} (${campaignId})\n`);

    // Get execution phases for this campaign
    const { data: phases, error: phasesError } = await supabase
      .from('execution_phases')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('phase_number');

    if (phasesError) throw phasesError;

    if (!phases || phases.length === 0) {
      console.log('❌ No execution phases found. Please create phases first.');
      console.log('   Phases can be created during campaign setup.');
      return;
    }

    console.log(`✅ Found ${phases.length} execution phases\n`);

    // Seed tasks for each phase
    for (const phase of phases) {
      const phaseType = phase.phase_type.toLowerCase();
      const tasksForPhase = PHASE_TASKS[phaseType as keyof typeof PHASE_TASKS] || [];

      if (tasksForPhase.length === 0) {
        console.log(`⚠️  No sample tasks defined for phase: ${phase.phase_name}`);
        continue;
      }

      console.log(`📝 Seeding ${tasksForPhase.length} tasks for phase: ${phase.phase_name}`);

      for (let i = 0; i < tasksForPhase.length; i++) {
        const task = tasksForPhase[i];
        const actionId = uuidv4();
        
        // Simulate different states
        const daysAgo = Math.floor(Math.random() * 14) + 1;
        const startedAt = getTimestamp(daysAgo, 9); // 9 AM
        const isCompleted = Math.random() > 0.3; // 70% completed
        
        // Create the task
        const { error: actionError } = await supabase
          .from('marketer_actions')
          .insert([
            {
              id: actionId,
              campaign_id: campaignId,
              action_type: task.action_type,
              title: task.title,
              description: task.description,
              timestamp: startedAt,
              status: isCompleted ? 'completed' : 'in_progress',
              created_by: task.created_by,
              metadata: {},
              phase_id: phase.id,
              estimated_time_hours: task.estimated_time_hours,
              started_at: startedAt,
              completed_at: isCompleted ? getTimestamp(daysAgo - 1, 18) : null, // 6 PM next day
              time_in_phase_minutes: Math.floor(task.actual_time_hours * 60),
            },
          ]);

        if (actionError) {
          console.error(`   ❌ Error creating task "${task.title}":`, actionError);
          continue;
        }

        // Create phase history entry
        if (isCompleted) {
          const timeSpentMinutes = Math.floor(task.actual_time_hours * 60);
          const { error: historyError } = await supabase
            .from('task_phase_history')
            .insert([
              {
                action_id: actionId,
                phase_id: phase.id,
                phase_name: phase.phase_name,
                entered_at: startedAt,
                exited_at: getTimestamp(daysAgo - 1, 18),
                time_spent_minutes: timeSpentMinutes,
              },
            ]);

          if (historyError) {
            console.error(`   ⚠️  Error creating phase history:`, historyError);
          }
        }
      }

      console.log(`   ✅ Created ${tasksForPhase.length} tasks\n`);
    }

    // Print summary statistics
    const { data: taskCount } = await supabase
      .from('marketer_actions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    const { data: completedCount } = await supabase
      .from('marketer_actions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'completed');

    console.log('\n📊 Summary:');
    console.log(`   Total tasks created: ${taskCount?.length || 0}`);
    console.log(`   Completed tasks: ${completedCount?.length || 0}`);
    console.log(`   In progress: ${(taskCount?.length || 0) - (completedCount?.length || 0)}`);

    console.log('\n✨ Phase-based task seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run dev');
    console.log(`  2. Navigate to: /campaigns/${campaignId}/kanban`);
    console.log('  3. See the phase-based task kanban board!\n');
  } catch (error) {
    console.error('❌ Error seeding phase-based tasks:', error);
    throw error;
  }
}

// Run the seed function
seedPhaseBasedTasks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
