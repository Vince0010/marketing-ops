/**
 * Seed Low Operational Health Campaign
 * 
 * Creates a campaign with low operational health (significant delays and drift)
 * Run with: npx tsx scripts/seed-low-health-campaign.ts
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

async function main() {
    console.log('🔴 Seeding Low Operational Health Campaign...\n')

    // 1. Create the campaign with low operational health
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
            name: 'RetailMax Holiday Disaster',
            description: 'Campaign with severe timeline delays and multiple blocked phases - demonstrating low operational health',
            industry: 'Retail',
            status: 'in_progress',
            start_date: '2026-01-20',
            end_date: '2026-02-28',
            total_budget: 35000.00,
            daily_budget: 1500.00,
            campaign_type: 'seasonal_promo',
            primary_objective: 'sales',
            primary_kpi: 'ROAS',
            target_value: 4.0,
            secondary_kpis: ['CTR', 'conversion_rate'],
            target_audience: JSON.stringify({
                demographics: { age_range: ['25-54'], gender: 'all', locations: ['US'] },
                psychographics: { interests: ['shopping', 'deals'], behaviors: ['frequent_shoppers'] }
            }),
            audience_type: ['warm', 'retargeting'],
            operational_health: 35, // Low operational health!
            performance_health: 45,
            drift_count: 5,
            positive_drift_count: 0,
            negative_drift_count: 5,
            risk_score: 85,
            gate_status: 'pause'
        })
        .select()
        .single()

    if (campaignError || !campaign) {
        console.error('❌ Error creating campaign:', campaignError?.message)
        process.exit(1)
    }

    console.log(`✅ Created campaign: ${campaign.name} (ID: ${campaign.id})`)

    // 2. Create phases with significant delays
    const phases = [
        {
            phase_number: 1,
            phase_name: 'Strategy & Planning',
            phase_type: 'planning',
            planned_start_date: '2026-01-20',
            planned_end_date: '2026-01-22',
            planned_duration_days: 3,
            actual_start_date: '2026-01-20',
            actual_end_date: '2026-01-25', // 3 days late!
            actual_duration_days: 6,
            status: 'completed',
            drift_days: 3,
            drift_type: 'negative',
            owner: 'Marketing Team',
            activities: ['Market research', 'Competitor analysis', 'Strategy development'],
            deliverables: ['Strategy document']
        },
        {
            phase_number: 2,
            phase_name: 'Creative Development',
            phase_type: 'creative',
            planned_start_date: '2026-01-23',
            planned_end_date: '2026-01-28',
            planned_duration_days: 6,
            actual_start_date: '2026-01-26',
            actual_end_date: '2026-02-05', // 8 days late!
            actual_duration_days: 11,
            status: 'completed',
            drift_days: 5,
            drift_type: 'negative',
            owner: 'Creative Team',
            activities: ['Ad design', 'Copy writing', 'Video production'],
            deliverables: ['Ad creatives', 'Video assets']
        },
        {
            phase_number: 3,
            phase_name: 'Compliance & Approval',
            phase_type: 'compliance',
            planned_start_date: '2026-01-29',
            planned_end_date: '2026-01-31',
            planned_duration_days: 3,
            actual_start_date: '2026-02-06',
            actual_end_date: null, // Still in progress!
            actual_duration_days: null,
            status: 'blocked', // BLOCKED!
            drift_days: 8,
            drift_type: 'negative',
            owner: 'Legal Team',
            activities: ['Legal review', 'Client approval'],
            deliverables: ['Approved creatives']
        },
        {
            phase_number: 4,
            phase_name: 'Technical Setup',
            phase_type: 'setup',
            planned_start_date: '2026-02-01',
            planned_end_date: '2026-02-03',
            planned_duration_days: 3,
            status: 'pending',
            owner: 'Tech Team',
            activities: ['Campaign configuration', 'Pixel setup'],
            deliverables: ['Configured campaign']
        },
        {
            phase_number: 5,
            phase_name: 'Launch',
            phase_type: 'launch',
            planned_start_date: '2026-02-04',
            planned_end_date: '2026-02-04',
            planned_duration_days: 1,
            status: 'pending',
            owner: 'Campaign Manager',
            activities: ['Campaign launch'],
            deliverables: ['Live campaign']
        },
        {
            phase_number: 6,
            phase_name: 'Optimization',
            phase_type: 'optimization',
            planned_start_date: '2026-02-05',
            planned_end_date: '2026-02-28',
            planned_duration_days: 24,
            status: 'pending',
            owner: 'Performance Team',
            activities: ['Performance monitoring', 'Budget optimization'],
            deliverables: ['Optimized campaign']
        }
    ]

    const { data: createdPhases, error: phasesError } = await supabase
        .from('execution_phases')
        .insert(phases.map(p => ({ ...p, campaign_id: campaign.id })))
        .select()

    if (phasesError) {
        console.error('❌ Error creating phases:', phasesError.message)
    } else {
        console.log(`✅ Created ${createdPhases?.length} phases with significant delays`)
    }

    // 3. Create drift events
    const blockedPhase = createdPhases?.find(p => p.phase_name === 'Compliance & Approval')
    const creativePhase = createdPhases?.find(p => p.phase_name === 'Creative Development')
    const planningPhase = createdPhases?.find(p => p.phase_name === 'Strategy & Planning')

    const driftEvents = [
        {
            campaign_id: campaign.id,
            phase_id: planningPhase?.id,
            drift_days: 3,
            drift_type: 'negative',
            reason: 'Stakeholder availability issues caused strategy delays',
            impact_description: 'Cascading delay to all subsequent phases',
            lesson_learned: 'Schedule stakeholder meetings before project kickoff',
            phase_name: 'Strategy & Planning',
            planned_duration: 3,
            actual_duration: 6,
            root_cause: 'Stakeholder scheduling conflicts',
            attribution: 'Internal Team',
            recorded_by: 'System'
        },
        {
            campaign_id: campaign.id,
            phase_id: creativePhase?.id,
            drift_days: 5,
            drift_type: 'negative',
            reason: 'Multiple creative revisions required by client',
            impact_description: 'Major delay pushing launch past critical window',
            lesson_learned: 'Get detailed creative brief upfront',
            phase_name: 'Creative Development',
            planned_duration: 6,
            actual_duration: 11,
            root_cause: 'Unclear creative direction from client',
            attribution: 'Client',
            recorded_by: 'Creative Team'
        },
        {
            campaign_id: campaign.id,
            phase_id: blockedPhase?.id,
            drift_days: 8,
            drift_type: 'negative',
            reason: 'Legal compliance issues with promotional claims',
            impact_description: 'Campaign blocked pending legal resolution',
            lesson_learned: 'Review compliance requirements before creative development',
            phase_name: 'Compliance & Approval',
            planned_duration: 3,
            actual_duration: null,
            root_cause: 'Promotional claims require substantiation',
            attribution: 'Legal Team',
            recorded_by: 'Legal Team'
        }
    ]

    const { error: driftError } = await supabase
        .from('drift_events')
        .insert(driftEvents)

    if (driftError) {
        console.error('⚠️ Error creating drift events:', driftError.message)
    } else {
        console.log('✅ Created drift events documenting delays')
    }

    // 4. Create risk score
    const { error: riskError } = await supabase
        .from('risk_scores')
        .insert({
            campaign_id: campaign.id,
            overall_score: 85,
            risk_level: 'critical',
            timeline_risk: 95,
            budget_risk: 70,
            resource_risk: 60,
            performance_risk: 80,
            risk_factors: [
                'Significant timeline drift (16+ days)',
                'Blocked compliance phase',
                'Missed promotional window',
                'Client relationship strain'
            ],
            mitigation_suggestions: [
                'Escalate legal issues to senior management',
                'Prepare alternative creative without contested claims',
                'Consider postponing to next promotional period',
                'Schedule daily standups until launch'
            ],
            gate_recommendation: 'pause',
            gate_reason: 'Critical timeline drift and blocked phase require immediate intervention',
            calculated_by: 'system'
        })

    if (riskError) {
        console.error('⚠️ Error creating risk score:', riskError.message)
    } else {
        console.log('✅ Created high-risk score assessment')
    }

    // 5. Create tasks for each phase
    const taskTemplates = [
        { title: 'Review market research data', action_type: 'planning', priority: 'high' },
        { title: 'Finalize campaign brief', action_type: 'planning', priority: 'high' },
        { title: 'Create banner ads v1', action_type: 'creative_asset', priority: 'critical' },
        { title: 'Design carousel creatives', action_type: 'creative_asset', priority: 'high' },
        { title: 'Write ad copy variations', action_type: 'copy_review', priority: 'medium' },
        { title: 'Produce video ad', action_type: 'creative_asset', priority: 'critical' },
        { title: 'Legal compliance review', action_type: 'legal_approval', priority: 'critical' },
        { title: 'Client approval meeting', action_type: 'approval', priority: 'high' },
        { title: 'Configure audience targeting', action_type: 'platform_setup', priority: 'high' },
        { title: 'Set up tracking pixels', action_type: 'platform_setup', priority: 'medium' },
        { title: 'Launch campaign', action_type: 'launch', priority: 'critical' },
        { title: 'Monitor initial performance', action_type: 'optimization', priority: 'high' },
    ]

    const tasksToCreate: any[] = []
    const statuses = ['completed', 'completed', 'in_progress', 'in_progress', 'planned', 'planned'] as const

    if (createdPhases) {
        for (let i = 0; i < taskTemplates.length; i++) {
            const template = taskTemplates[i]
            const phase = createdPhases[i % createdPhases.length]
            const status = statuses[i % statuses.length]

            tasksToCreate.push({
                campaign_id: campaign.id,
                phase_id: phase.id,
                title: template.title,
                description: `Task for ${phase.phase_name} phase - ${template.action_type}`,
                action_type: template.action_type,
                status: status,
                priority: template.priority,
                timestamp: new Date().toISOString(),
                estimated_hours: Math.floor(Math.random() * 8) + 2,
                started_at: status !== 'planned' ? new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() : null,
                completed_at: status === 'completed' ? new Date().toISOString() : null,
                created_by: 'system',
            })
        }

        const { error: tasksError } = await supabase
            .from('marketer_actions')
            .insert(tasksToCreate)

        if (tasksError) {
            console.error('⚠️ Error creating tasks:', tasksError.message)
        } else {
            console.log(`✅ Created ${tasksToCreate.length} tasks for the campaign`)
        }
    }

    console.log('\n🎯 Low Operational Health Campaign seeded successfully!')
    console.log(`\n📊 Campaign Summary:`)
    console.log(`   Name: ${campaign.name}`)
    console.log(`   ID: ${campaign.id}`)
    console.log(`   Operational Health: 35% (LOW)`)
    console.log(`   Status: In Progress (with BLOCKED phase)`)
    console.log(`   Total Drift: 16+ days`)
    console.log(`\n🔗 View at: http://localhost:5173/campaigns/${campaign.id}/tracker`)
}

main().catch(console.error)
