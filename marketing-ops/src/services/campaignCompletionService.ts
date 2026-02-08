import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import type { PerformanceMetric, OverrideEvent } from '@/types/database'
import { calculateFinalPerformance, evaluateOverrideOutcome } from '@/utils/calculations'

/**
 * Campaign Completion Service
 * Handles campaign completion, performance evaluation, and override outcome analysis
 */
export const campaignCompletionService = {
  /**
   * Process campaign completion when the final phase is completed
   * This includes:
   * 1. Updating campaign status to 'completed'
   * 2. Calculating final performance metrics
   * 3. Processing override outcomes if applicable
   */
  async processCampaignCompletion(campaignId: string): Promise<void> {
    console.log('[CampaignCompletion] Processing completion for campaign:', campaignId)

    try {
      // Fetch campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError
      if (!campaign) throw new Error('Campaign not found')

      // Fetch performance metrics
      const { data: performanceMetrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('metric_date', { ascending: true })

      if (metricsError) throw metricsError

      // Calculate final performance outcome
      const outcome = calculateFinalPerformance(
        campaign as Campaign,
        (performanceMetrics || []) as PerformanceMetric[]
      )

      console.log('[CampaignCompletion] Campaign outcome:', outcome)

      // Update campaign with final metrics
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          final_cost: performanceMetrics?.reduce((sum, m) => sum + (m.spend || 0), 0) || 0,
        })
        .eq('id', campaignId)

      if (updateError) throw updateError

      // Process override outcomes if campaign had an override
      if (campaign.gate_overridden) {
        await this.processOverrideOutcome(campaign as Campaign, outcome)
      }

      console.log('[CampaignCompletion] Campaign completion processed successfully')
    } catch (error) {
      console.error('[CampaignCompletion] Error processing completion:', error)
      throw error
    }
  },

  /**
   * Process override outcome for campaigns that had decision gate overrides
   */
  async processOverrideOutcome(
    campaign: Campaign,
    campaignOutcome: ReturnType<typeof calculateFinalPerformance>
  ): Promise<void> {
    console.log('[CampaignCompletion] Processing override outcome for campaign:', campaign.id)

    try {
      // Fetch override event
      const { data: overrideEvents, error: overrideError } = await supabase
        .from('override_events')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('override_type', 'gate_decision')
        .order('created_at', { ascending: false })
        .limit(1)

      if (overrideError) throw overrideError

      if (!overrideEvents || overrideEvents.length === 0) {
        console.log('[CampaignCompletion] No override event found (unexpected)')
        return
      }

      const overrideEvent = overrideEvents[0] as OverrideEvent

      // Evaluate override outcome
      const evaluation = evaluateOverrideOutcome(campaign, overrideEvent, campaignOutcome)

      console.log('[CampaignCompletion] Override evaluation:', evaluation)

      // Update override_events with outcome analysis
      const { error: updateError } = await supabase
        .from('override_events')
        .update({
          outcome: evaluation.outcome,
          outcome_explanation: evaluation.outcome_explanation,
          lesson_learned: evaluation.lesson_learned,
          system_was_correct: evaluation.system_was_correct,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', overrideEvent.id)

      if (updateError) throw updateError

      console.log('[CampaignCompletion] Override outcome updated successfully')
    } catch (error) {
      console.error('[CampaignCompletion] Error processing override outcome:', error)
      throw error
    }
  },

  /**
   * Manually trigger campaign completion processing
   * Useful for batch processing or fixing incomplete records
   */
  async triggerCompletion(campaignId: string): Promise<void> {
    return this.processCampaignCompletion(campaignId)
  },
}
