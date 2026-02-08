import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Campaign } from '../types/campaign'
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Rocket,
  BarChart3,
  MoreVertical,
  Eye,
  Trash2,
  Pause,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/utils/formatting'
import { getGateDecision } from '@/utils/calculations'
import { DecisionStatusBadge } from '@/components/DecisionStatusBadge'
import { ObservationModeBadge } from '@/components/ObservationModeBadge'

interface Stats {
  total: number
  inProgress: number
  completed: number
  planning: number
}

// Skeleton component inline for loading state
function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded-full" />
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
            <div className="h-2 w-full bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonStatCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-12 bg-muted rounded" />
          </div>
          <div className="w-12 h-12 bg-muted rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    planning: 0,
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])

      const newStats: Stats = {
        total: data?.length || 0,
        inProgress: data?.filter((c) => c.status === 'in_progress').length || 0,
        completed: data?.filter((c) => c.status === 'completed').length || 0,
        planning:
          data?.filter((c) => c.status === 'planning' || c.status === 'validated').length || 0,
      }
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }
    > = {
      planning: { variant: 'secondary', label: 'Planning' },
      validated: { variant: 'outline', label: 'Validated', className: 'border-expedition-trail/40 text-expedition-trail bg-expedition-trail/10' },
      in_progress: { variant: 'inProgress', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      paused: { variant: 'destructive', label: 'Paused' },
    }
    const badge = variants[status] || variants.planning
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    )
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-expedition-evergreen'
    if (health >= 60) return 'text-expedition-signal'
    return 'text-expedition-checkpoint'
  }

  const getHealthBg = (health: number) => {
    if (health >= 80) return '[&>div]:bg-expedition-evergreen'
    if (health >= 60) return '[&>div]:bg-expedition-signal'
    return '[&>div]:bg-expedition-checkpoint'
  }

  const getCampaignRoute = (campaign: Campaign) => {
    if (campaign.status === 'planning') return `/campaigns/${campaign.id}/validate`
    if (campaign.status === 'in_progress') return `/campaigns/${campaign.id}/tracker`
    if (campaign.status === 'completed') return `/campaigns/${campaign.id}/analytics`
    return `/campaigns/${campaign.id}/validate`
  }

  const filterCampaigns = (filter: string) => {
    if (filter === 'all') return campaigns
    if (filter === 'active') return campaigns.filter((c) => c.status === 'in_progress')
    if (filter === 'planning') return campaigns.filter((c) => c.status === 'planning' || c.status === 'validated')
    if (filter === 'completed') return campaigns.filter((c) => c.status === 'completed')
    return campaigns
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your marketing campaigns</p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new" className="gap-2">
            <Rocket className="w-4 h-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-trail/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-expedition-trail" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-summit/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-expedition-summit" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planning</p>
                <p className="text-2xl font-bold mt-1">{stats.planning}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-signal/10 rounded-lg flex items-center justify-center">
                <Clock className="text-expedition-signal" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-evergreen/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-expedition-evergreen" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns with Tabs Filter */}
      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Rocket className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first campaign</p>
            <Button asChild>
              <Link to="/campaigns/new">
                Create Campaign
                <ArrowRight size={20} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="planning">Planning ({stats.planning})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            </TabsList>
          </div>

          {['all', 'active', 'planning', 'completed'].map((filter) => (
            <TabsContent key={filter} value={filter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterCampaigns(filter).map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                            {(campaign.status === 'planning' || campaign.status === 'validated') && (
                              <DecisionStatusBadge
                                decision={
                                  campaign.gate_decision ??
                                  getGateDecision(campaign.risk_score ?? 0)
                                }
                              />
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {campaign.campaign_type?.replace(/_/g, ' ')}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {campaign.gate_overridden && (
                            <ObservationModeBadge
                              riskScore={campaign.risk_score}
                              campaignStatus={campaign.status}
                            />
                          )}
                          {getStatusBadge(campaign.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              {campaign.status === 'in_progress' && (
                                <DropdownMenuItem>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Campaign
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'paused' && (
                                <DropdownMenuItem>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Campaign
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-expedition-checkpoint">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Key Metrics Row */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget</span>
                          <p className="font-semibold">{formatCurrency(campaign.total_budget)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">KPI</span>
                          <p className="font-semibold">{campaign.primary_kpi}</p>
                        </div>
                      </div>

                      {/* Health bar for in-progress */}
                      {campaign.status === 'in_progress' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Operational Health</span>
                            <span className={`font-semibold ${getHealthColor(campaign.operational_health)}`}>
                              {campaign.operational_health}%
                            </span>
                          </div>
                          <Progress value={campaign.operational_health} className={`h-1.5 ${getHealthBg(campaign.operational_health)}`} />
                          {campaign.drift_count > 0 && (
                            <div className="flex items-center gap-1 text-xs text-expedition-signal">
                              <AlertCircle size={12} />
                              {campaign.drift_count} drift event{campaign.drift_count !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Risk score for planning */}
                      {(campaign.status === 'planning' || campaign.status === 'validated') && campaign.risk_score != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Risk Score</span>
                          <span
                            className={`font-semibold ${
                              campaign.risk_score >= 70
                                ? 'text-expedition-evergreen'
                                : campaign.risk_score >= 50
                                ? 'text-expedition-signal'
                                : 'text-expedition-checkpoint'
                            }`}
                          >
                            {campaign.risk_score}/100
                          </span>
                        </div>
                      )}

                      {/* Date range */}
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        {new Date(campaign.start_date).toLocaleDateString()} &ndash;{' '}
                        {new Date(campaign.end_date).toLocaleDateString()}
                      </div>

                      {/* View button */}
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={getCampaignRoute(campaign)}>
                          View Campaign <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {filterCampaigns(filter).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns in this category
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
