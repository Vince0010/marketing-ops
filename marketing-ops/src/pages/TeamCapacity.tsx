import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Users, Calendar, AlertCircle, TrendingUp, Clock, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  utilization_target: number
}

interface TeamCapacity {
  id: string
  member_id: string
  week_starting: string
  total_hours_available: number
  hours_allocated: number
  utilization_percentage: number
  is_overloaded: boolean
  campaign_assignments: string[]
  member?: TeamMember
}

export default function TeamCapacity() {
  const [teamCapacity, setTeamCapacity] = useState<TeamCapacity[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      const [capacityRes, membersRes] = await Promise.all([
        supabase
          .from('team_capacity')
          .select(`
            *,
            team_members (*)
          `)
          .order('utilization_percentage', { ascending: false }),
        supabase
          .from('team_members')
          .select('*')
          .order('name')
      ])

      if (capacityRes.data) {
        setTeamCapacity(capacityRes.data.map(item => ({
          ...item,
          member: item.team_members
        })))
      }
      if (membersRes.data) {
        setTeamMembers(membersRes.data)
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

  const getUtilizationBadge = (utilization: number, isOverloaded?: boolean) => {
    if (isOverloaded) {
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
    ? teamCapacity.reduce((sum, tc) => sum + tc.utilization_percentage, 0) / totalMembers 
    : 0
  const overloadedCount = teamCapacity.filter(tc => tc.is_overloaded).length
  const totalHours = teamCapacity.reduce((sum, tc) => sum + tc.hours_allocated, 0)

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
            {teamCapacity.map((tc) => (
              <div 
                key={tc.id} 
                className={`border rounded-lg p-4 ${getUtilizationBg(tc.utilization_percentage)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {tc.member?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'TM'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{tc.member?.name || 'Unknown Member'}</h3>
                      <p className="text-sm text-muted-foreground">{tc.member?.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getUtilizationBadge(tc.utilization_percentage, tc.is_overloaded)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilization</span>
                    <span className={`font-semibold ${getUtilizationColor(tc.utilization_percentage)}`}>
                      {tc.utilization_percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={tc.utilization_percentage} 
                    className={`h-2 ${tc.utilization_percentage >= 90 ? '[&>div]:bg-red-500' : tc.utilization_percentage >= 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hours Allocated</span>
                      <p className="font-medium">{tc.hours_allocated}h / {tc.total_hours_available}h</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target Utilization</span>
                      <p className="font-medium">{tc.member?.utilization_target || 85}%</p>
                    </div>
                  </div>

                  {tc.campaign_assignments && tc.campaign_assignments.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">Assigned Campaigns</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tc.campaign_assignments.map((campaign, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {campaign}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {tc.is_overloaded && (
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
            ))}

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
