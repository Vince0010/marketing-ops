import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react'

export default function CampaignValidate() {
  const { id } = useParams<{ id: string }>()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validate Campaign</h1>
        <p className="text-muted-foreground mt-1">Campaign ID: {id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>AI-powered risk analysis for your campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
                  <span className="text-3xl font-bold text-green-600">85</span>
                </div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <Badge variant="default" className="mt-2">Low Risk</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Budget Allocation</p>
                  <p className="text-sm text-muted-foreground">Budget is well-distributed across channels</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Timeline Feasibility</p>
                  <p className="text-sm text-muted-foreground">Campaign timeline is realistic and achievable</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Team Capacity</p>
                  <p className="text-sm text-muted-foreground">Consider additional resources for peak periods</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Decision Gate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the risk assessment and approve or request changes to the campaign.
            </p>
            
            <div className="space-y-2">
              <Button className="w-full" size="lg">
                Approve Campaign
              </Button>
              <Button className="w-full" variant="outline">
                Request Changes
              </Button>
              <Button className="w-full" variant="destructive">
                Reject Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
