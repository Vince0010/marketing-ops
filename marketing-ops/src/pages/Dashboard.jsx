import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Rocket,
  BarChart3
} from 'lucide-react'

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
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
      const stats = {
        total: data?.length || 0,
        inProgress: data?.filter(c => c.status === 'in_progress').length || 0,
        completed: data?.filter(c => c.status === 'completed').length || 0,
        planning: data?.filter(c => c.status === 'planning' || c.status === 'validated').length || 0
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      planning: { color: 'bg-gray-100 text-gray-700', label: 'Planning' },
      validated: { color: 'bg-blue-100 text-blue-700', label: 'Validated' },
      in_progress: { color: 'bg-green-100 text-green-700', label: 'In Progress' },
      completed: { color: 'bg-purple-100 text-purple-700', label: 'Completed' },
      paused: { color: 'bg-red-100 text-red-700', label: 'Paused' }
    }
    const badge = badges[status] || badges.planning
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-green-600'
    if (health >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCampaignRoute = (campaign) => {
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
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Planning</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.planning}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <Rocket className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first campaign</p>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Create Campaign</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                to={getCampaignRoute(campaign)}
                className="card-hover"
              >
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

                  <ArrowRight className="text-gray-400" size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}