/**
 * Performance Correlation Component
 * 
 * Displays correlation insights between task events and performance metrics.
 * Uses AI to analyze causation between delays/completions and sales/engagement changes.
 */

import { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Brain,
    RefreshCw,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Clock,
    DollarSign,
    Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CorrelationInsight, WeeklyDataReport } from '@/types/database'
import { isApiKeyConfigured } from '@/services/correlationService'

interface PerformanceCorrelationProps {
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
    onRunAnalysis: () => void
}

export function PerformanceCorrelation({
    weeklyReports,
    correlationInsights,
    correlationSummary,
    isLoading: _isLoading,
    isAnalyzing,
    error,
    onRunAnalysis,
}: PerformanceCorrelationProps) {
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
    const [showAllInsights, setShowAllInsights] = useState(false)

    const hasApiKey = isApiKeyConfigured()
    const hasData = weeklyReports.length > 0
    const displayedInsights = showAllInsights
        ? correlationInsights
        : correlationInsights.slice(0, 5)

    const getImpactIcon = (impact: string) => {
        switch (impact) {
            case 'positive':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'negative':
                return <TrendingDown className="w-4 h-4 text-red-500" />
            default:
                return <Minus className="w-4 h-4 text-gray-400" />
        }
    }

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'strong':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'moderate':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'weak':
                return 'bg-gray-100 text-gray-600 border-gray-200'
            default:
                return 'bg-slate-100 text-slate-500 border-slate-200'
        }
    }

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'delay':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'early_completion':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'phase_change':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            <CardTitle className="text-lg">Performance Correlation Analysis</CardTitle>
                        </div>
                        <Button
                            onClick={onRunAnalysis}
                            disabled={!hasData || isAnalyzing || !hasApiKey}
                            size="sm"
                            className="gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Analyze Correlations
                                </>
                            )}
                        </Button>
                    </div>
                    <CardDescription>
                        Discover relationships between task events (delays, completions) and performance changes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!hasApiKey && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm mb-4">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>Set VITE_GROQ_API_KEY in .env to enable AI-powered correlation analysis</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!hasData ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No weekly data reports available</p>
                            <p className="text-sm">Run the weekly-data-migration.sql to add sample data</p>
                        </div>
                    ) : correlationInsights.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Click "Analyze Correlations" to find relationships</p>
                            <p className="text-sm">between task events and performance changes</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-lg border p-3 text-center">
                                    <div className="text-2xl font-bold">{correlationSummary.totalEvents}</div>
                                    <div className="text-xs text-muted-foreground">Events Analyzed</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center bg-green-50 border-green-200">
                                    <div className="text-2xl font-bold text-green-600">
                                        {correlationSummary.positiveImpacts}
                                    </div>
                                    <div className="text-xs text-green-600">Positive Impact</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center bg-red-50 border-red-200">
                                    <div className="text-2xl font-bold text-red-600">
                                        {correlationSummary.negativeImpacts}
                                    </div>
                                    <div className="text-xs text-red-600">Negative Impact</div>
                                </div>
                                <div className="rounded-lg border p-3 text-center bg-purple-50 border-purple-200">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {correlationSummary.strongCorrelations}
                                    </div>
                                    <div className="text-xs text-purple-600">Strong Correlations</div>
                                </div>
                            </div>

                            {/* Key Insight */}
                            {correlationSummary.keyInsight && (
                                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-purple-700">Key Insight</div>
                                            <div className="text-sm text-purple-600 mt-1">{correlationSummary.keyInsight}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Correlation Insights List */}
            {correlationInsights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Correlation Insights</CardTitle>
                        <CardDescription>
                            Task events and their impact on campaign performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {displayedInsights.map((insight) => (
                            <div
                                key={insight.id}
                                className={cn(
                                    'border rounded-lg overflow-hidden transition-all',
                                    insight.correlation_strength === 'strong'
                                        ? 'border-purple-200'
                                        : 'border-border'
                                )}
                            >
                                {/* Insight Header */}
                                <button
                                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpandedInsight(
                                        expandedInsight === insight.id ? null : insight.id
                                    )}
                                >
                                    <div className="mt-0.5">{getImpactIcon(insight.performance_impact)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className={getEventTypeColor(insight.event_type)}
                                            >
                                                {insight.event_type.replace('_', ' ')}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={getStrengthColor(insight.correlation_strength)}
                                            >
                                                {insight.correlation_strength} correlation
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(insight.event_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1 line-clamp-2">{insight.event_description}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {expandedInsight === insight.id ? (
                                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {expandedInsight === insight.id && (
                                    <div className="px-4 pb-4 pt-0 space-y-4 border-t">
                                        {/* AI Analysis */}
                                        <div className="p-3 rounded-md bg-muted/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Brain className="w-4 h-4 text-purple-500" />
                                                <span className="text-sm font-medium">AI Analysis</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {insight.confidence}% confidence
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{insight.ai_analysis}</p>
                                        </div>

                                        {/* Metric Changes */}
                                        {insight.metric_changes.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Performance Changes</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {insight.metric_changes.map((change, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                'flex items-center gap-3 p-2 rounded-md',
                                                                change.change_pct >= 0 ? 'bg-green-50' : 'bg-red-50'
                                                            )}
                                                        >
                                                            <div className="flex-shrink-0">
                                                                {change.metric.toLowerCase().includes('sales') ||
                                                                    change.metric.toLowerCase().includes('revenue') ? (
                                                                    <DollarSign className="w-4 h-4" />
                                                                ) : (
                                                                    <Users className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-muted-foreground">{change.metric}</div>
                                                                <div className="text-sm font-medium">
                                                                    {change.previous_value.toLocaleString()} → {change.current_value.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'flex-shrink-0',
                                                                    change.change_pct >= 0
                                                                        ? 'text-green-700 border-green-300'
                                                                        : 'text-red-700 border-red-300'
                                                                )}
                                                            >
                                                                {change.change_pct >= 0 ? '+' : ''}{change.change_pct.toFixed(1)}%
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actionable Insight */}
                                        {insight.actionable_insight && (
                                            <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-100">
                                                <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-medium text-blue-700">Recommendation</div>
                                                    <p className="text-sm text-blue-600">{insight.actionable_insight}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Show More Button */}
                        {correlationInsights.length > 5 && (
                            <div className="text-center pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllInsights(!showAllInsights)}
                                >
                                    {showAllInsights
                                        ? `Show Less`
                                        : `Show ${correlationInsights.length - 5} More`}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Weekly Data Preview */}
            {weeklyReports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Weekly Performance Data</CardTitle>
                        <CardDescription>
                            Recent performance metrics by week
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 px-3 text-left font-medium">Week</th>
                                        <th className="py-2 px-3 text-right font-medium">Views</th>
                                        <th className="py-2 px-3 text-right font-medium">Engagement</th>
                                        <th className="py-2 px-3 text-right font-medium">Sales</th>
                                        <th className="py-2 px-3 text-right font-medium">Revenue</th>
                                        <th className="py-2 px-3 text-right font-medium">ROAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {weeklyReports.slice(-4).map((report) => (
                                        <tr key={report.id} className="border-b last:border-0">
                                            <td className="py-2 px-3">
                                                <div className="font-medium">
                                                    {new Date(report.week_starting).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                {report.notes && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {report.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {(report.facebook_views + report.instagram_views).toLocaleString()}
                                                {report.views_change_pct != null && (
                                                    <span className={cn(
                                                        'ml-1 text-xs',
                                                        (report.views_change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        ({(report.views_change_pct ?? 0) >= 0 ? '+' : ''}{(report.views_change_pct ?? 0).toFixed(0)}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {report.total_engagement.toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {report.total_sales}
                                                {report.sales_change_pct != null && (
                                                    <span className={cn(
                                                        'ml-1 text-xs',
                                                        (report.sales_change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        ({(report.sales_change_pct ?? 0) >= 0 ? '+' : ''}{(report.sales_change_pct ?? 0).toFixed(0)}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                ${report.total_revenue.toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {report.roas?.toFixed(2)}x
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
