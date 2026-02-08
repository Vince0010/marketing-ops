import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Users, AlertCircle, TrendingUp, Clock, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamMemberRow {
  id: string
  name: string
  role: string
  email?: string
  department?: string
  weekly_capacity_hours?: number
  status?: string
}

interface TeamCapacityRow {
  id: string
  team_member_id: string
  campaign_id: string
  phase_id?: string
  week_starting: string
  allocated_hours: number
  actual_hours?: number
  utilization_percentage?: number
  allocation_status?: string
  notes?: string
  team_members?: TeamMemberRow
  campaigns?: { id: string; name: string }
}

export default function TeamCapacity() {
  const [teamCapacity, setTeamCapacity] = useState<TeamCapacityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      const capacityRes = await supabase
        .from('team_capacity')
        .select(`
          *,
          team_members (*),
          campaigns (id, name)
        `)
        .order('allocated_hours', { ascending: false })

      if (capacityRes.data) {
        setTeamCapacity(capacityRes.data)
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUtilizationBg = (utilization: number): string => {
    if (utilization >= 90) return 'border-red-200 bg-red-50'
    if (utilization >= 80) return 'border-yellow-200 bg-yellow-50'
    return 'border-green-200 bg-green-50'
  }

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 100) {
      return <Badge variant="destructive" className="text-xs">Overloaded</Badge>
    }
    if (utilization >= 90) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>
    }
    if (utilization >= 80) {
      return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">High</Badge>
    }
    return <Badge variant="outline" className="text-xs border-green-500 text-green-700">Normal</Badge>
  }

  // Calculate summary stats
  const totalMembers = teamCapacity.length
  const avgUtilization = totalMembers > 0
    ? teamCapacity.reduce((sum, tc) => sum + (tc.utilization_percentage || 0), 0) / totalMembers
    : 0
  const overloadedCount = teamCapacity.filter(tc => (tc.utilization_percentage || 0) >= 100).length
  const totalHours = teamCapacity.reduce((sum, tc) => sum + tc.allocated_hours, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Capacity</h1>
          <p className="text-muted-foreground">Loading team capacity data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Capacity Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor team bandwidth and resource allocation</p>
      </div>

      {/* Overload Alert */}
      {overloadedCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Resource Warning</AlertTitle>
          <AlertDescription>
            {overloadedCount} team member{overloadedCount > 1 ? 's are' : ' is'} overloaded. 
            Consider redistributing workload or bringing in additional resources.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUtilizationColor(avgUtilization)}`}>
              {avgUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overloaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overloadedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overloadedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Members over capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">Allocated this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Current capacity allocation and workload distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamCapacity.map((tc) => {
              const utilization = tc.utilization_percentage || 0
              const member = tc.team_members
              const weeklyCapacity = member?.weekly_capacity_hours || 40
              return (
                <div
                  key={tc.id}
                  className={`border rounded-lg p-4 ${getUtilizationBg(utilization)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || 'TM'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{member?.name || 'Unknown Member'}</h3>
                        <p className="text-sm text-muted-foreground">{member?.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getUtilizationBadge(utilization)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Utilization</span>
                      <span className={`font-semibold ${getUtilizationColor(utilization)}`}>
                        {utilization.toFixed(0)}%
                      </span>
                    </div>

                    <Progress
                      value={Math.min(utilization, 100)}
                      className={`h-2 ${utilization >= 90 ? '[&>div]:bg-red-500' : utilization >= 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                    />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hours Allocated</span>
                        <p className="font-medium">{tc.allocated_hours}h / {weeklyCapacity}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status</span>
                        <p className="font-medium capitalize">{tc.allocation_status || 'planned'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Campaign</span>
                        <p className="font-medium text-blue-600 truncate" title={tc.campaigns?.name}>
                          {tc.campaigns?.name || 'Unknown Campaign'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Week Starting</span>
                        <p className="font-medium">{new Date(tc.week_starting).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {utilization >= 100 && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm">
                        <div className="flex items-center gap-1 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-medium">Overload Warning</span>
                        </div>
                        <p className="text-red-600 text-xs mt-1">
                          This team member is operating beyond capacity. Consider reallocating work or extending timelines.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {teamCapacity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No team capacity data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capacity Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Planning</CardTitle>
          <CardDescription>Forecast resource needs for upcoming campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Capacity planning chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
