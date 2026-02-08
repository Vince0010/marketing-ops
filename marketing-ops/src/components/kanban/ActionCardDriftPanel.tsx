import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Clock, Facebook, Instagram, MonitorPlay, Linkedin, Twitter, Youtube } from 'lucide-react'
import type { ActionCardDriftAnalysis } from '@/types/actions'
import { formatMinutes, getDriftStatusColor, getDriftStatusBadgeColor } from '@/utils/actionCardDrift'
import { cn } from '@/lib/utils'

interface ActionCardDriftPanelProps {
    driftAnalyses: ActionCardDriftAnalysis[]
    loading?: boolean
}

const platformIcons: Record<string, typeof Facebook> = {
    facebook: Facebook,
    instagram: Instagram,
    tiktok: MonitorPlay,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
}

export function ActionCardDriftPanel({ driftAnalyses, loading }: ActionCardDriftPanelProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ad Deliverable Drift Analysis</CardTitle>
                    <CardDescription>Loading drift data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (driftAnalyses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ad Deliverable Drift Analysis</CardTitle>
                    <CardDescription>No action cards with planned timelines found</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Action cards will appear here once they have planned timelines</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Calculate summary stats
    const totalCards = driftAnalyses.length
    const aheadCount = driftAnalyses.filter(d => d.overall_status === 'ahead').length
    const onTrackCount = driftAnalyses.filter(d => d.overall_status === 'on_track').length
    const behindCount = driftAnalyses.filter(d => d.overall_status === 'behind').length

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Ad Deliverable Drift Analysis
                </CardTitle>
                <CardDescription>
                    Planned vs actual time per ad deliverable across all stages
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{totalCards}</div>
                        <div className="text-xs text-muted-foreground">Total Ads</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{aheadCount}</div>
                        <div className="text-xs text-muted-foreground">Ahead</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{onTrackCount}</div>
                        <div className="text-xs text-muted-foreground">On Track</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{behindCount}</div>
                        <div className="text-xs text-muted-foreground">Behind</div>
                    </div>
                </div>

                {/* Drift Cards */}
                <div className="space-y-3">
                    {driftAnalyses.map((drift) => {
                        const PlatformIcon = drift.platform ? platformIcons[drift.platform] : null
                        const StatusIcon = drift.overall_status === 'ahead' 
                            ? TrendingUp 
                            : drift.overall_status === 'behind' 
                            ? TrendingDown 
                            : Minus

                        return (
                            <div
                                key={drift.action_id}
                                className="border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {PlatformIcon && <PlatformIcon className="w-4 h-4 text-slate-500" />}
                                            <h4 className="font-medium text-sm">{drift.action_title}</h4>
                                        </div>
                                        {drift.platform && drift.post_type && (
                                            <Badge variant="secondary" className="text-xs">
                                                {drift.platform} · {drift.post_type}
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge className={cn('text-xs', getDriftStatusBadgeColor(drift.overall_status))}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {drift.overall_status === 'ahead' ? 'Ahead' : drift.overall_status === 'behind' ? 'Behind' : 'On Track'}
                                    </Badge>
                                </div>

                                {/* Overall Time Summary */}
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <div className="text-muted-foreground mb-1">Planned</div>
                                        <div className="font-medium">{formatMinutes(drift.total_planned_minutes)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Actual</div>
                                        <div className="font-medium">{formatMinutes(drift.total_actual_minutes)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Drift</div>
                                        <div className={cn('font-medium', getDriftStatusColor(drift.overall_status))}>
                                            {drift.total_drift_minutes > 0 ? '+' : ''}{formatMinutes(drift.total_drift_minutes)}
                                            <span className="text-xs ml-1">
                                                ({drift.total_drift_percentage > 0 ? '+' : ''}{drift.total_drift_percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span>Progress</span>
                                            <span>{drift.completed_phases_count} / {drift.total_phases_count} phases</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all"
                                                style={{
                                                    width: `${(drift.completed_phases_count / drift.total_phases_count) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Current Phase */}
                                {drift.current_phase_name && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Current:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {drift.current_phase_name}
                                        </Badge>
                                    </div>
                                )}

                                {/* Phase Breakdown (expandable details) */}
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                        View phase breakdown
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                        {drift.phase_drifts.map((phaseDrift) => (
                                            <div key={phaseDrift.phase_id} className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground">{phaseDrift.phase_name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        {formatMinutes(phaseDrift.planned_minutes)}
                                                    </span>
                                                    <span>→</span>
                                                    <span className="font-medium">
                                                        {formatMinutes(phaseDrift.actual_minutes)}
                                                    </span>
                                                    <span className={cn('font-medium min-w-[60px] text-right', getDriftStatusColor(phaseDrift.status))}>
                                                        {phaseDrift.drift_minutes > 0 ? '+' : ''}
                                                        {formatMinutes(phaseDrift.drift_minutes)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
