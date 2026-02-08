/**
 * Test Script: Override Learning System
 * 
 * This script demonstrates the override learning flow:
 * 1. Find a campaign with gate_overridden = true
 * 2. Simulate campaign completion
 * 3. Process override outcome
 * 4. Display results
 */

import { createClient } from '@supabase/supabase-js'
import { calculateFinalPerformance, evaluateOverrideOutcome } from '../src/utils/calculations'
import type { Campaign } from '../src/types/campaign'
import type { PerformanceMetric, OverrideEvent } from '../src/types/database'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xktszgxqtkcpewmhxbhj.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdHN6Z3hxdGtjcGV3bWh4YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDc1MjEsImV4cCI6MjA4NjAyMzUyMX0.ni8M8EPVXl99pSgv8izLCVLXGlteLF8eMuNtMPm0Z_U'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testOverrideLearning() {
  console.log('🧪 Testing Override Learning System\n')

  try {
    // 1. Find campaigns with overrides
    console.log('1️⃣ Finding campaigns with gate overrides...')
    const { data: campaigns, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('gate_overridden', true)
      .limit(5)

    if (campError) throw campError
    
    if (!campaigns || campaigns.length === 0) {
      console.log('❌ No campaigns with overrides found in database')
      return
    }

    console.log(`✅ Found ${campaigns.length} campaign(s) with overrides\n`)

    // Test each campaign
    for (const campaign of campaigns) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`📊 Campaign: ${campaign.name}`)
      console.log(`   Status: ${campaign.status}`)
      console.log(`   Gate Status: ${campaign.gate_status}`)
      console.log(`   Override: ${campaign.gate_overridden ? 'YES' : 'NO'}`)
      console.log(`${'='.repeat(80)}\n`)

      // 2. Fetch override event
      const { data: overrideEvents, error: overrideError } = await supabase
        .from('override_events')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('override_type', 'gate_decision')
        .order('created_at', { ascending: false })
        .limit(1)

      if (overrideError) throw overrideError

      if (!overrideEvents || overrideEvents.length === 0) {
        console.log('⚠️  No override event found (might be AI recommendation override, not gate)')
        continue
      }

      const overrideEvent = overrideEvents[0] as OverrideEvent

      console.log('2️⃣ Override Event Details:')
      console.log(`   Type: ${overrideEvent.override_type}`)
      console.log(`   AI Recommended: ${overrideEvent.original_recommendation}`)
      console.log(`   User Decided: ${overrideEvent.user_action}`)
      console.log(`   Reason: ${overrideEvent.reason}`)
      console.log(`   Risk Score: ${overrideEvent.risk_score_at_time}`)
      console.log(`   System Confidence: ${overrideEvent.system_confidence}%\n`)

      // 3. Fetch performance metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('metric_date', { ascending: true })

      if (metricsError) throw metricsError

      if (!metrics || metrics.length === 0) {
        console.log('⚠️  No performance metrics found - creating sample data...')
        // Create sample performance metrics for testing
        const sampleMetric = {
          campaign_id: campaign.id,
          metric_date: new Date().toISOString().split('T')[0],
          metric_source: 'meta_ads',
          roas: campaign.primary_kpi === 'ROAS' ? campaign.target_value * 1.2 : undefined,
          cpa: campaign.primary_kpi === 'CPA' ? campaign.target_value * 0.8 : undefined,
          spend: 5000,
          revenue: 6000,
          conversions: 150,
          impressions: 50000,
          clicks: 2500,
          ctr: 5.0
        }
        
        await supabase.from('performance_metrics').insert(sampleMetric)
        metrics.push(sampleMetric as any)
      }

      console.log(`3️⃣ Performance Metrics:`)
      console.log(`   Records: ${metrics.length}`)
      console.log(`   Primary KPI: ${campaign.primary_kpi}`)
      console.log(`   Target Value: ${campaign.target_value}`)

      // 4. Calculate final performance
      console.log('\n4️⃣ Calculating Final Performance...')
      const outcome = calculateFinalPerformance(
        campaign as Campaign,
        metrics as PerformanceMetric[]
      )

      console.log(`   Result: ${outcome.success.toUpperCase()}`)
      console.log(`   Achievement: ${outcome.achievementRate.toFixed(1)}%`)
      console.log(`   Actual: ${outcome.finalMetricValue.toFixed(2)}`)
      console.log(`   Target: ${outcome.targetValue}`)
      console.log(`   Explanation: ${outcome.explanation}\n`)

      // 5. Evaluate override outcome
      console.log('5️⃣ Evaluating Override Decision...')
      const evaluation = evaluateOverrideOutcome(
        campaign as Campaign,
        overrideEvent,
        outcome
      )

      console.log(`   System Was Correct: ${evaluation.system_was_correct ? '✅ YES' : '❌ NO'}`)
      console.log(`   Outcome: ${evaluation.outcome}`)
      console.log(`   Explanation: ${evaluation.outcome_explanation}`)
      console.log(`   Lesson Learned: ${evaluation.lesson_learned}\n`)

      // 6. Update database if not already updated
      if (!overrideEvent.outcome) {
        console.log('6️⃣ Updating override event in database...')
        const { error: updateError } = await supabase
          .from('override_events')
          .update({
            outcome: evaluation.outcome,
            outcome_explanation: evaluation.outcome_explanation,
            lesson_learned: evaluation.lesson_learned,
            system_was_correct: evaluation.system_was_correct,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', overrideEvent.id)

        if (updateError) {
          console.error('   ❌ Error updating:', updateError.message)
        } else {
          console.log('   ✅ Override event updated successfully\n')
        }
      } else {
        console.log('6️⃣ Override event already has outcome recorded:\n')
        console.log(`   Existing Outcome: ${overrideEvent.outcome}`)
        console.log(`   System Was Correct: ${overrideEvent.system_was_correct}`)
      }

      console.log('\n' + '✅ '.repeat(40))
    }

    console.log('\n\n🎉 Override Learning System Test Complete!\n')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testOverrideLearning()
