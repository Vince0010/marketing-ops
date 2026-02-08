import type { 
    MarketerAction, 
    TaskPhaseHistory, 
    ActionCardDriftAnalysis,
    ActionCardPhaseDrift,
    ActionCardPlannedTimeline
} from '@/types/actions'

/**
 * Calculate drift analysis for a single action card
 */
export function calculateActionCardDrift(
    action: MarketerAction,
    history: TaskPhaseHistory[]
): ActionCardDriftAnalysis | null {
    if (!action.planned_timeline) {
        return null
    }

    const planned = action.planned_timeline as ActionCardPlannedTimeline
    const actionHistory = history.filter(h => h.action_id === action.id)

    // Calculate drift per phase
    const phaseDrifts: ActionCardPhaseDrift[] = []
    let totalPlannedMinutes = 0
    let totalActualMinutes = 0

    // Sort phases by phase_number
    const sortedPhases = Object.entries(planned).sort(
        ([, a], [, b]) => a.phase_number - b.phase_number
    )

    for (const [phaseId, phaseInfo] of sortedPhases) {
        const plannedMinutes = phaseInfo.planned_minutes
        totalPlannedMinutes += plannedMinutes

        // Get all history entries for this phase
        const phaseHistoryEntries = actionHistory.filter(h => h.phase_id === phaseId)
        
        // Calculate actual time spent in this phase
        const actualMinutes = phaseHistoryEntries.reduce((sum, entry) => {
            return sum + (entry.time_spent_minutes || 0)
        }, 0)

        // Also add current time if card is currently in this phase
        if (action.phase_id === phaseId && action.started_at) {
            const now = new Date()
            const startedAt = new Date(action.started_at)
            const currentMinutes = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60))
            totalActualMinutes += currentMinutes
        } else {
            totalActualMinutes += actualMinutes
        }

        const driftMinutes = actualMinutes - plannedMinutes
        const driftPercentage = plannedMinutes > 0 
            ? Math.round((driftMinutes / plannedMinutes) * 100)
            : 0

        let status: 'ahead' | 'on_track' | 'behind' = 'on_track'
        if (driftPercentage < -10) status = 'ahead'
        else if (driftPercentage > 10) status = 'behind'

        phaseDrifts.push({
            phase_id: phaseId,
            phase_name: phaseInfo.phase_name,
            phase_number: phaseInfo.phase_number,
            planned_minutes: plannedMinutes,
            actual_minutes: actualMinutes,
            drift_minutes: driftMinutes,
            drift_percentage: driftPercentage,
            status
        })
    }

    const totalDriftMinutes = totalActualMinutes - totalPlannedMinutes
    const totalDriftPercentage = totalPlannedMinutes > 0
        ? Math.round((totalDriftMinutes / totalPlannedMinutes) * 100)
        : 0

    let overallStatus: 'ahead' | 'on_track' | 'behind' = 'on_track'
    if (totalDriftPercentage < -10) overallStatus = 'ahead'
    else if (totalDriftPercentage > 10) overallStatus = 'behind'

    // Extract platform and post type from metadata
    const metadata = action.metadata as Record<string, unknown> | undefined
    const platform = typeof metadata?.platform === 'string' ? metadata.platform : undefined
    const post_type = typeof metadata?.post_type === 'string' ? metadata.post_type : undefined

    return {
        action_id: action.id,
        action_title: action.title,
        platform,
        post_type,
        total_planned_minutes: totalPlannedMinutes,
        total_actual_minutes: totalActualMinutes,
        total_drift_minutes: totalDriftMinutes,
        total_drift_percentage: totalDriftPercentage,
        overall_status: overallStatus,
        phase_drifts: phaseDrifts,
        current_phase_id: action.phase_id,
        current_phase_name: action.phase_name,
        completed_phases_count: action.completed_phases?.length || 0,
        total_phases_count: Object.keys(planned).length
    }
}

/**
 * Calculate drift for all action cards in a campaign
 */
export function calculateCampaignActionCardDrifts(
    actions: MarketerAction[],
    history: TaskPhaseHistory[]
): ActionCardDriftAnalysis[] {
    return actions
        .map(action => calculateActionCardDrift(action, history))
        .filter((drift): drift is ActionCardDriftAnalysis => drift !== null)
}

/**
 * Format minutes to human-readable time
 */
export function formatMinutes(minutes: number): string {
    if (minutes === 0) return '0m'
    
    const hours = Math.floor(Math.abs(minutes) / 60)
    const mins = Math.abs(minutes) % 60
    const sign = minutes < 0 ? '-' : ''
    
    if (hours === 0) return `${sign}${mins}m`
    if (mins === 0) return `${sign}${hours}h`
    return `${sign}${hours}h ${mins}m`
}

/**
 * Get status color for drift display
 */
export function getDriftStatusColor(status: 'ahead' | 'on_track' | 'behind'): string {
    switch (status) {
        case 'ahead':
            return 'text-green-600 dark:text-green-400'
        case 'behind':
            return 'text-red-600 dark:text-red-400'
        default:
            return 'text-slate-600 dark:text-slate-400'
    }
}

/**
 * Get status badge color for drift display
 */
export function getDriftStatusBadgeColor(status: 'ahead' | 'on_track' | 'behind'): string {
    switch (status) {
        case 'ahead':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        case 'behind':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
}
