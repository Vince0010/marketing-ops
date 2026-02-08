import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SimpleCampaign {
  id: string
  name: string
  status: string
  performance_health?: number
  operational_health?: number
}

export default function DatabaseTest() {
  const [campaigns, setCampaigns] = useState<SimpleCampaign[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...')
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status, performance_health, operational_health')
        .limit(10)
      
      console.log('Database response:', { data, error })
      
      if (error) {
        setError(error.message)
      } else {
        setCampaigns(data || [])
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testSpecificCampaign = async (campaignId: string) => {
    try {
      console.log(`Testing campaign ${campaignId}...`)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      
      console.log(`Campaign ${campaignId} response:`, { data, error })
    } catch (err) {
      console.error(`Campaign ${campaignId} test failed:`, err)
    }
  }

  if (loading) {
    return <div className="p-8">Testing database connection...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Database Connection Test</h1>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="font-semibold text-red-800">Database Error:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-semibold text-green-800">Database Connected Successfully!</h3>
          <p className="text-green-700">Found {campaigns.length} campaigns</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Campaigns:</h2>
        {campaigns.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No campaigns found in database</p>
            <p className="text-yellow-700 text-sm mt-2">
              This means the seed data hasn't been applied to the remote Supabase database.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border p-4 rounded bg-gray-50">
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="text-sm text-gray-600">ID: {campaign.id}</p>
                <p className="text-sm text-gray-600">Status: {campaign.status}</p>
                <p className="text-sm text-gray-600">
                  Performance Health: {campaign.performance_health ?? 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Operational Health: {campaign.operational_health ?? 'N/A'}
                </p>
                <button 
                  onClick={() => testSpecificCampaign(campaign.id)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Test Full Data
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Test Specific Campaign IDs:</h2>
        <div className="flex gap-2 flex-wrap">
          {['camp-successful-001', 'camp-failure-003', 'camp-positive-002'].map(id => (
            <button
              key={id}
              onClick={() => testSpecificCampaign(id)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Test {id}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Refresh Test
        </button>
      </div>
    </div>
  )
}