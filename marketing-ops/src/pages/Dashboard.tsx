import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Campaign } from '../types/campaign'
import {
  ArrowRight,
  Mountain,
  BarChart3,
  Flag,
  Clock,
  CheckCircle2,
  Users,
  Cloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignStatusCard } from '@/components/CampaignStatusCard'

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
      {/* Summit Control Center Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground expedition-log">Summit Control Center</h1>
          <p className="text-muted-foreground mt-1 base-camp-notes">Active expeditions, weather alerts, and team readiness</p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new" className="gap-2">
            <Mountain className="w-4 h-4" />
            Begin Ascent
          </Link>
        </Button>
      </div>

      {/* Stats: Active Expeditions, Summits Today, Weather Alerts, Team Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-expedition-camp-1 hover:shadow-expedition-camp-2 transition-shadow animate-mountain-ascent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground weather-updates">Active Expeditions</p>
                <p className="altitude-readings mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mountain className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-expedition-camp-1 hover:shadow-expedition-camp-2 transition-shadow animate-mountain-ascent" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground weather-updates">Summits Today</p>
                <p className="altitude-readings mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-turquoiseSurf/10 rounded-lg flex items-center justify-center">
                <Flag className="text-expedition-turquoiseSurf" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-expedition-camp-1 hover:shadow-expedition-camp-2 transition-shadow animate-mountain-ascent" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground weather-updates">Weather Alerts</p>
                <p className="altitude-readings mt-1">{stats.planning + stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-expedition-rosewood/10 rounded-lg flex items-center justify-center">
                <Cloud className="text-expedition-rosewood" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-expedition-camp-1 hover:shadow-expedition-camp-2 transition-shadow animate-mountain-ascent" style={{ animationDelay: '300ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground weather-updates">Team Readiness</p>
                <p className="altitude-readings mt-1">95%</p>
              </div>
              <div className="w-12 h-12 bg-expedition-cerulean/10 rounded-lg flex items-center justify-center">
                <Users className="text-expedition-cerulean" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summit Attempts (Campaigns) with Tabs Filter */}
      {campaigns.length === 0 ? (
        <Card className="text-center py-12 shadow-expedition-camp-2">
          <CardContent>
            <Mountain className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2 expedition-log">No summit attempts yet</h3>
            <p className="text-muted-foreground mb-6 base-camp-notes">Plan your first expedition and begin ascent</p>
            <Button asChild>
              <Link to="/campaigns/new">
                Begin Ascent
                <ArrowRight size={20} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/80">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.inProgress})</TabsTrigger>
              <TabsTrigger value="planning">Planning ({stats.planning})</TabsTrigger>
              <TabsTrigger value="completed">Summits ({stats.completed})</TabsTrigger>
            </TabsList>
          </div>

          {['all', 'active', 'planning', 'completed'].map((filter) => (
            <TabsContent key={filter} value={filter} className="space-y-4">
              <div className="campaign-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterCampaigns(filter).map((campaign, idx) => (
                  <div
                    key={campaign.id}
                    className="animate-mountain-ascent"
                    style={{ animationDelay: `${Math.min(idx * 100, 400)}ms` }}
                  >
                    <CampaignStatusCard
                      campaign={campaign}
                      getCampaignRoute={getCampaignRoute}
                      animationDelay={idx * 100}
                    />
                  </div>
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
