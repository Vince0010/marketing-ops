/**
 * Hook for fetching weekly data reports and correlation insights
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { WeeklyDataReport, CorrelationInsight, MetaAdsMetrics } from '@/types/database'
import type { ExecutionPhase, DriftEvent } from '@/types/phase'
import type { MarketerAction } from '@/types/actions'
import { analyzeTaskPerformanceCorrelation, summarizeCorrelations } from '@/services/correlationService'

interface UseWeeklyDataReportsReturn {
    weeklyReports: WeeklyDataReport[]
    correlationInsights: CorrelationInsight[]
    correlationSummary: {
        totalEvents: number
        positiveImpacts: number
        negativeImpacts: number
        strongCorrelations: number
        keyInsight: string | null
    }
    isLoading: boolean
    isAnalyzing: boolean
    error: string | null
    refetch: () => void
    runCorrelationAnalysis: () => Promise<void>
}

export function useWeeklyDataReports(
    campaignId: string | undefined,
    campaignName: string,
    phases: ExecutionPhase[],
    tasks: MarketerAction[],
    driftEvents: DriftEvent[]
): UseWeeklyDataReportsReturn {
    const [weeklyReports, setWeeklyReports] = useState<WeeklyDataReport[]>([])
    const [metaAdsMetrics, setMetaAdsMetrics] = useState<MetaAdsMetrics | null>(null)
    const [correlationInsights, setCorrelationInsights] = useState<CorrelationInsight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchWeeklyReports = useCallback(async () => {
        if (!campaignId) return

        setIsLoading(true)
        setError(null)

        try {
            // Fetch both weekly reports and Meta Ads metrics in parallel
            const [weeklyRes, metaAdsRes] = await Promise.all([
                supabase
                    .from('weekly_data_reports')
                    .select('*')
                    .eq('campaign_id', campaignId)
                    .order('week_starting', { ascending: true }),
                supabase
                    .from('meta_ads_metrics')
                    .select('*')
                    .eq('campaign_id', campaignId)
                    .single()
            ])

            if (weeklyRes.error) {
                console.warn('No weekly reports found:', weeklyRes.error)
            }
            setWeeklyReports(weeklyRes.data || [])

            // Meta Ads metrics are optional
            if (metaAdsRes.data && !metaAdsRes.error) {
                setMetaAdsMetrics(metaAdsRes.data as MetaAdsMetrics)
            } else {
                setMetaAdsMetrics(null)
            }
        } catch (err) {
            console.error('Error fetching reports:', err)
            setError('Failed to load data reports')
            setWeeklyReports([])
            setMetaAdsMetrics(null)
        } finally {
            setIsLoading(false)
        }
    }, [campaignId])

    const runCorrelationAnalysis = useCallback(async () => {
        if (!campaignId || weeklyReports.length === 0) {
            setError('No weekly data available for analysis')
            return
        }

        setIsAnalyzing(true)
        setError(null)

        try {
            const insights = await analyzeTaskPerformanceCorrelation({
                campaignId,
                campaignName,
                phases,
                tasks,
                driftEvents,
                weeklyReports,
                metaAdsMetrics, // Include Meta Ads metrics in correlation analysis
            })

            setCorrelationInsights(insights)
        } catch (err) {
            console.error('Correlation analysis failed:', err)
            setError('Failed to analyze correlations')
        } finally {
            setIsAnalyzing(false)
        }
    }, [campaignId, campaignName, phases, tasks, driftEvents, weeklyReports, metaAdsMetrics])

    // Fetch weekly reports when campaign changes
    useEffect(() => {
        fetchWeeklyReports()
    }, [fetchWeeklyReports])

    // Calculate summary from insights
    const correlationSummary = summarizeCorrelations(correlationInsights)

    return {
        weeklyReports,
        correlationInsights,
        correlationSummary,
        isLoading,
        isAnalyzing,
        error,
        refetch: fetchWeeklyReports,
        runCorrelationAnalysis,
    }
}
