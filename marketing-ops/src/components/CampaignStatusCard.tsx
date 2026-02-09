import { Link } from 'react-router-dom'
import {
  ClipboardList,
  TrendingUp,
  Trophy,
  BarChart3,
  MoreVertical,
  Eye,
  Trash2,
  Pause,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/utils/formatting'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/types/campaign'
import { DecisionStatusBadge } from '@/components/DecisionStatusBadge'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'
import { getGateDecision } from '@/utils/calculations'

type PerformanceTier = 'exceeding' | 'meeting' | 'below' | 'critical'

function getPerformanceTier(health: number): PerformanceTier {
  if (health >= 90) return 'exceeding'
  if (health >= 70) return 'meeting'
  if (health >= 50) return 'below'
  return 'critical'
}

function getIndustryStatusLabel(
  status: string,
  operationalHealth: number
): 'On Track' | 'Needs Attention' | 'At Risk' | 'Complete' {
  if (status === 'completed') return 'Complete'
  if (status === 'planning' || status === 'validated') return 'On Track'
  if (operationalHealth >= 80) return 'On Track'
  if (operationalHealth >= 60) return 'Needs Attention'
  return 'At Risk'
}

function getPhaseLabel(status: string): 'Setup' | 'Live' | 'Analysis' {
  if (status === 'planning' || status === 'validated') return 'Setup'
  if (status === 'in_progress' || status === 'paused') return 'Live'
  return 'Analysis'
}

function getTagline(status: string): string {
  if (status === 'planning' || status === 'validated') return 'Strategy & Setup'
  if (status === 'in_progress' || status === 'paused') return 'Live & Optimizing'
  return 'Results & Learnings'
}

interface CampaignStatusCardProps {
  campaign: Campaign
  getCampaignRoute: (c: Campaign) => string
  animationDelay?: number
}

export function CampaignStatusCard({
  campaign,
  getCampaignRoute,
  animationDelay = 0,
}: CampaignStatusCardProps) {
  const status = campaign.status
  const health = campaign.operational_health ?? 0
  const performanceTier = getPerformanceTier(health)
  const industryStatus = getIndustryStatusLabel(status, health)
  const phaseLabel = getPhaseLabel(status)
  const tagline = getTagline(status)

  const isPlanning = status === 'planning' || status === 'validated'
  const isActive = status === 'in_progress' || status === 'paused'
  const isCompleted = status === 'completed'

  const cardModifier =
    isPlanning
      ? 'campaign-status-card--planning'
      : isActive
        ? `campaign-status-card--active-${performanceTier}`
        : 'campaign-status-card--completed'

  // Cards with lighter fills need dark text for contrast
  const useDarkText = isPlanning || (isActive && performanceTier === 'exceeding')

  const progressValue = isCompleted ? 100 : isActive ? health : 0
  const progressColor =
    isActive
      ? performanceTier === 'exceeding'
        ? '[&>div]:bg-[#50A6C9]'
        : performanceTier === 'meeting'
          ? '[&>div]:bg-[#26532B]'
          : performanceTier === 'below'
            ? '[&>div]:bg-[#347698]'
            : '[&>div]:bg-[#1B3D20]'
      : '[&>div]:bg-[#26532B]'

  const statusDotColor = isPlanning
    ? '#9F9F9D'
    : isActive
      ? performanceTier === 'exceeding'
        ? '#50A6C9'
        : performanceTier === 'meeting'
          ? '#26532B'
          : performanceTier === 'below'
            ? '#347698'
            : '#1B3D20'
      : '#1C486F'

  const FlagIcon = isPlanning ? ClipboardList : isActive ? TrendingUp : Trophy

  return (
    <article
      className={cn(
        'campaign-status-card relative overflow-hidden border bg-card text-card-foreground p-0',
        cardModifier
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div className="relative z-10 flex flex-col">
        {/* Top: name (left), performance flag + status dot (right) */}
        <div className="flex items-start justify-between gap-3 p-5 pb-2">
          <div className="min-w-0 flex-1">
            <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>
              {tagline}
            </p>
            <h3 className={cn("font-bold text-base truncate pr-2", useDarkText ? 'text-[#051524]' : 'text-white')}>{campaign.name}</h3>
            {(isPlanning) && (
              <div className="mt-1.5">
                <DecisionStatusBadge
                  decision={
                    campaign.gate_decision ??
                    getGateDecision(campaign.risk_score ?? 0)
                  }
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={cn("performance-flag", useDarkText ? 'bg-[#051524]/10 text-[#051524]/70' : 'bg-white/10 text-white/70')}
              title={phaseLabel}
            >
              <FlagIcon className="w-4 h-4" />
            </div>
            <div
              className={cn(
                'status-dot shrink-0',
                isActive && 'status-dot--pulse'
              )}
              style={{
                backgroundColor: statusDotColor,
                color: statusDotColor,
              }}
              title={industryStatus}
              aria-hidden
            />
            {campaign.gate_overridden && (
              <ObservationModeBadge
                riskScore={campaign.risk_score}
                campaignStatus={campaign.status}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={getCampaignRoute(campaign)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {status === 'in_progress' && (
                  <DropdownMenuItem>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Campaign
                  </DropdownMenuItem>
                )}
                {status === 'paused' && (
                  <DropdownMenuItem>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Middle: Timeline (progress), Phase, Resources */}
        <div className="px-5 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={cn("font-medium", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>Timeline</span>
            <span
              className={cn(
                'font-semibold',
                useDarkText ? 'text-[#051524]' : 'text-white'
              )}
            >
              {industryStatus}
            </span>
          </div>
          <Progress
            value={progressValue}
            className={cn('h-1.5', progressColor)}
          />
          <div className={cn("flex items-center justify-between text-[11px]", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>
            <span>Phase: {phaseLabel}</span>
            <span>Resources: —</span>
          </div>
        </div>

        {/* Bottom: Primary KPI (large), Budget (right), mini metrics */}
        <div className={cn("px-5 pb-5 pt-2 border-t", useDarkText ? 'border-[#051524]/15' : 'border-white/15')}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>
                {campaign.primary_kpi}
              </p>
              <p className={cn("text-2xl font-bold tabular-nums", useDarkText ? 'text-[#051524]' : 'text-white')}>
                {campaign.target_value != null
                  ? typeof campaign.target_value === 'number'
                    ? campaign.primary_kpi === 'ROAS'
                      ? `${campaign.target_value}x`
                      : campaign.primary_kpi === 'CTR' || campaign.primary_kpi === 'engagement_rate'
                        ? `${campaign.target_value}%`
                        : String(campaign.target_value)
                    : String(campaign.target_value)
                  : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>
                Budget
              </p>
              <p className={cn("text-sm font-semibold tabular-nums", useDarkText ? 'text-[#051524]' : 'text-white')}>
                {formatCurrency(campaign.total_budget)}
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-3 mt-3 text-[11px]", useDarkText ? 'text-[#051524]/60' : 'text-white/60')}>
            <span>{campaign.primary_kpi}</span>
            <span>·</span>
            <span>{campaign.campaign_type?.replace(/_/g, ' ')}</span>
            {isActive && campaign.drift_count > 0 && (
              <>
                <span>·</span>
                <span className={useDarkText ? 'text-[#051524] font-medium' : 'text-white font-medium'}>
                  {campaign.drift_count} drift
                </span>
              </>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="w-full mt-3">
            <Link to={getCampaignRoute(campaign)}>
              View campaign
              <BarChart3 className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
