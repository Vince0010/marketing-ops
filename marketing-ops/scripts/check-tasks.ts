/**
 * Check task distribution across campaigns
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
        .from('marketer_actions')
        .select('id, campaign_id, title')

    if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
        return
    }

    // Group by campaign_id
    const byCampaign = new Map<string, number>()
    tasks?.forEach(t => {
        const current = byCampaign.get(t.campaign_id) || 0
        byCampaign.set(t.campaign_id, current + 1)
    })

    console.log('Tasks per campaign:')
    for (const [campaignId, count] of byCampaign) {
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('name')
            .eq('id', campaignId)
            .single()
        console.log(`  ${campaignId.substring(0, 8)}... (${campaign?.name || 'Unknown'}): ${count} tasks`)
    }

    console.log(`\nTotal tasks: ${tasks?.length}`)

    // Check for tasks without campaign_id
    const orphanTasks = tasks?.filter(t => !t.campaign_id) || []
    if (orphanTasks.length > 0) {
        console.log(`\nWARNING: ${orphanTasks.length} orphan tasks without campaign_id!`)
    }
}

check()
