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

  // Top border color logic – cycle blues, reserve green for high success
  const cardModifier =
    isPlanning
      ? 'campaign-status-card--planning'
      : isActive
        ? `campaign-status-card--active-${performanceTier}`
        : 'campaign-status-card--completed'

  const progressValue = isCompleted ? 100 : isActive ? health : 0
  const progressColor =
    isActive
      ? performanceTier === 'exceeding'
        ? '[&>div]:bg-[#26532B]' // positive drift / high success
        : performanceTier === 'meeting'
          ? '[&>div]:bg-[#347698]'
          : performanceTier === 'below'
            ? '[&>div]:bg-[#1C486F]'
            : '[&>div]:bg-[#9F9F9D]'
      : '[&>div]:bg-[#347698]'

  const statusDotColor = isPlanning
    ? '#9F9F9D'
    : isActive
      ? performanceTier === 'exceeding'
        ? '#26532B'
        : performanceTier === 'meeting'
          ? '#347698'
          : performanceTier === 'below'
            ? '#1C486F'
            : '#9F9F9D'
      : '#1C486F'

  const FlagIcon = isPlanning ? ClipboardList : isActive ? TrendingUp : Trophy

  return (
    <article
      className={cn(
        'campaign-status-card relative overflow-hidden border border-border bg-card text-card-foreground p-0',
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
            <p className="text-[10px] uppercase tracking-wider mb-0.5 text-muted-foreground">
              {tagline}
            </p>
            <h3 className="font-bold text-base truncate pr-2 text-[#1C486F]">{campaign.name}</h3>
            {isPlanning && (
              <div className="mt-1.5">
                <DecisionStatusBadge
                  decision={
                    (campaign as any).gate_decision ??
                    getGateDecision(campaign.risk_score ?? 0)
                  }
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="performance-flag bg-muted text-muted-foreground border border-border"
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
            <span className="font-medium text-muted-foreground">Timeline</span>
            <span className="font-semibold text-[#1C486F]">
              {industryStatus}
            </span>
          </div>
          <Progress
            value={progressValue}
            className={cn('h-1.5', progressColor)}
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Phase: {phaseLabel}</span>
            <span>Resources: —</span>
          </div>
        </div>

        {/* Bottom: Primary KPI, Budget, mini metrics */}
        <div className="px-5 pb-5 pt-2 border-t border-border/60">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-0.5 text-muted-foreground">
                {campaign.primary_kpi}
              </p>
              <p className="text-2xl font-bold tabular-nums text-[#1C486F]">
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
              <p className="text-[10px] uppercase tracking-wider mb-0.5 text-muted-foreground">
                Budget
              </p>
              <p className="text-sm font-semibold tabular-nums text-[#1C486F]">
                {formatCurrency(campaign.total_budget)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
            <span>{campaign.primary_kpi}</span>
            <span>·</span>
            <span>{campaign.campaign_type?.replace(/_/g, ' ')}</span>
            {isActive && campaign.drift_count > 0 && (
              <>
                <span>·</span>
                <span className="text-[#26532B] font-medium">
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

