/**
 * Seed Phase Tasks Script
 * 
 * Creates sample tasks across all phases with realistic time tracking data.
 * Run with: npm run seed:phase-tasks
 * Or: npx tsx scripts/seed-phase-tasks.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample task templates
const TASK_TEMPLATES = [
    { title: 'Design hero banner', action_type: 'creative_asset', estimated_hours: 4 },
    { title: 'Write ad copy v1', action_type: 'copy_review', estimated_hours: 2 },
    { title: 'Review legal compliance', action_type: 'legal_approval', estimated_hours: 1 },
    { title: 'Set up Facebook campaign', action_type: 'platform_setup', estimated_hours: 3 },
    { title: 'Configure audience targeting', action_type: 'audience_targeting', estimated_hours: 2 },
    { title: 'Allocate initial budget', action_type: 'budget_allocation', estimated_hours: 1 },
    { title: 'Create video ad', action_type: 'creative_asset', estimated_hours: 8 },
    { title: 'A/B test headlines', action_type: 'optimization', estimated_hours: 2 },
    { title: 'Prepare weekly report', action_type: 'reporting', estimated_hours: 3 },
    { title: 'Update landing page', action_type: 'creative_asset', estimated_hours: 4 },
    { title: 'Review performance metrics', action_type: 'performance_review', estimated_hours: 2 },
    { title: 'Optimize bid strategy', action_type: 'optimization', estimated_hours: 2 },
]

const STATUSES = ['planned', 'in_progress', 'completed'] as const
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

async function main() {
    console.log('🎯 Starting phase tasks seed...\n')

    // 1. Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, name')
        .limit(5)

    if (campaignsError || !campaigns?.length) {
        console.error('No campaigns found. Please create campaigns first.')
        process.exit(1)
    }

    console.log(`Found ${campaigns.length} campaigns\n`)

    for (const campaign of campaigns) {
        console.log(`\n📦 Processing campaign: ${campaign.name}`)

        // 2. Get phases for this campaign
        const { data: phases, error: phasesError } = await supabase
            .from('execution_phases')
            .select('*')
            .eq('campaign_id', campaign.id)
            .order('phase_number')

        if (phasesError || !phases?.length) {
            console.log('  ⚠️ No phases found, skipping')
            continue
        }

        console.log(`  Found ${phases.length} phases`)

        // 3. Create tasks distributed across phases
        const tasksToCreate: any[] = []
        const historyToCreate: any[] = []

        for (let i = 0; i < 20; i++) {
            const template = TASK_TEMPLATES[i % TASK_TEMPLATES.length]
            const phase = phases[i % phases.length]
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
            const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)]

            // Random time tracking data
            const hoursAgo = Math.floor(Math.random() * 48) + 1
            const startedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
            const timeInPhaseMinutes = Math.floor(Math.random() * 240) + 30 // 30-270 mins

            const taskId = crypto.randomUUID()

            tasksToCreate.push({
                id: taskId,
                campaign_id: campaign.id,
                phase_id: phase.id,
                title: `${template.title} #${i + 1}`,
                description: `Auto-generated task for ${phase.phase_name} phase`,
                action_type: template.action_type,
                status: status,
                priority: priority,
                timestamp: new Date().toISOString(),
                estimated_hours: template.estimated_hours,
                started_at: startedAt.toISOString(),
                completed_at: status === 'completed' ? new Date().toISOString() : null,
                time_in_phase_minutes: timeInPhaseMinutes,
                created_by: 'system',
            })

            // Create history entry
            historyToCreate.push({
                action_id: taskId,
                phase_id: phase.id,
                phase_name: phase.phase_name,
                entered_at: startedAt.toISOString(),
                exited_at: status === 'completed' ? new Date().toISOString() : null,
                time_spent_minutes: status === 'completed' ? timeInPhaseMinutes : null,
            })
        }

        // 4. Insert tasks
        const { error: tasksError } = await supabase
            .from('marketer_actions')
            .upsert(tasksToCreate, { onConflict: 'id' })

        if (tasksError) {
            console.error('  ❌ Error inserting tasks:', tasksError.message)
            continue
        }

        console.log(`  ✅ Created ${tasksToCreate.length} tasks`)

        // 5. Insert history
        const { error: historyError } = await supabase
            .from('task_phase_history')
            .insert(historyToCreate)

        if (historyError) {
            console.error('  ⚠️ Error inserting history:', historyError.message)
        } else {
            console.log(`  ✅ Created ${historyToCreate.length} history entries`)
        }
    }

    console.log('\n✨ Seed complete!')
}

main().catch(console.error)
