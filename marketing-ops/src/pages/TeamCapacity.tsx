import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Calendar, AlertCircle } from 'lucide-react'

export default function TeamCapacity() {
  const teamMembers = [
    { name: 'Sarah Johnson', role: 'Campaign Manager', utilization: 85, campaigns: 3 },
    { name: 'Mike Chen', role: 'Creative Director', utilization: 72, campaigns: 4 },
    { name: 'Emily Davis', role: 'Data Analyst', utilization: 95, campaigns: 5 },
    { name: 'Tom Wilson', role: 'Social Media Manager', utilization: 68, campaigns: 2 },
  ]

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 90) return <Badge variant="destructive">Overloaded</Badge>
    if (utilization >= 75) return <Badge variant="default">High Load</Badge>
    return <Badge variant="secondary">Available</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Capacity</h1>
        <p className="text-muted-foreground mt-1">Manage team bandwidth and workload</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">Active this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">80%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-muted-foreground mt-1">Member overloaded</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>Current workload and availability by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className={`text-lg font-bold ${getUtilizationColor(member.utilization)}`}>
                        {member.utilization}%
                      </p>
                      <p className="text-xs text-muted-foreground">{member.campaigns} campaigns</p>
                    </div>
                    {getUtilizationBadge(member.utilization)}
                  </div>
                </div>
                <Progress value={member.utilization} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
