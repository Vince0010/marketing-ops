import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react'

export default function CampaignTracker() {
  const { id } = useParams<{ id: string }>()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Execution Tracker</h1>
          <p className="text-muted-foreground mt-1">Campaign ID: {id}</p>
        </div>
        <Badge variant="default" className="gap-2">
          <Activity className="w-4 h-4" />
          In Progress
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Operational Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">85%</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <Progress value={85} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-yellow-600">72%</span>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <Progress value={72} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drift Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="execution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="execution">Execution Timeline</TabsTrigger>
          <TabsTrigger value="drift">Drift Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Phases</CardTitle>
              <CardDescription>Track progress across campaign phases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 1: Awareness</span>
                    <Badge>Completed</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 2: Consideration</span>
                    <Badge variant="default">In Progress</Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Phase 3: Conversion</span>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift">
          <Card>
            <CardHeader>
              <CardTitle>Drift Events</CardTitle>
              <CardDescription>Monitor campaign deviations from plan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Drift analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Suggested actions to improve campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Recommendations coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
