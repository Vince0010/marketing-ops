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
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Stats {
  total: number
  inProgress: number
  completed: number
  planning: number
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    planning: 0
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
      
      // Calculate stats
      const newStats: Stats = {
        total: data?.length || 0,
        inProgress: data?.filter(c => c.status === 'in_progress').length || 0,
        completed: data?.filter(c => c.status === 'completed').length || 0,
        planning: data?.filter(c => c.status === 'planning' || c.status === 'validated').length || 0
      }
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      planning: { variant: 'secondary', label: 'Planning' },
      validated: { variant: 'default', label: 'Validated' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
      paused: { variant: 'destructive', label: 'Paused' }
    }
    const badge = variants[status] || variants.planning
    return (
      <Badge variant={badge.variant}>
        {badge.label}
      </Badge>
    )
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600'
    if (health >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCampaignRoute = (campaign: Campaign) => {
    if (campaign.status === 'planning') return `/campaigns/${campaign.id}/validate`
    if (campaign.status === 'in_progress') return `/campaigns/${campaign.id}/tracker`
    if (campaign.status === 'completed') return `/campaigns/${campaign.id}/analytics`
    return `/campaigns/${campaign.id}/validate`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your marketing campaigns</p>
        </div>
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-blue-600" size={24} />
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
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
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
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
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={getCampaignRoute(campaign)}>
                  <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>Type: {campaign.campaign_type?.replace('_', ' ')}</span>
                      <span>Objective: {campaign.primary_objective}</span>
                      <span>Budget: ${campaign.total_budget?.toLocaleString()}</span>
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Health Indicators */}
                    {campaign.status === 'in_progress' && (
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">Operational Health:</span>
                          <span className={`text-sm font-semibold ${getHealthColor(campaign.operational_health)}`}>
                            {campaign.operational_health}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">Performance Health:</span>
                          <span className={`text-sm font-semibold ${getHealthColor(campaign.performance_health)}`}>
                            {campaign.performance_health}%
                          </span>
                        </div>
                        {campaign.drift_count > 0 && (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="text-yellow-600" size={16} />
                            <span className="text-xs text-gray-600">
                              {campaign.drift_count} drift event{campaign.drift_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk Score for Planning */}
                    {campaign.status === 'planning' && campaign.risk_score && (
                      <div className="flex items-center space-x-2 mt-3">
                        <span className="text-xs text-gray-600">Risk Score:</span>
                        <span className={`text-sm font-semibold ${
                          campaign.risk_score >= 70 ? 'text-green-600' :
                          campaign.risk_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {campaign.risk_score}/100
                        </span>
                      </div>
                    )}
                  </div>

                    <ArrowRight className="text-muted-foreground" size={20} />
                  </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
