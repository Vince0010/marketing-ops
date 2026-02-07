import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Rocket } from 'lucide-react'

export default function CampaignCreate() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-1">Plan your marketing campaign with AI-powered insights</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Campaign Details
          </CardTitle>
          <CardDescription>
            Enter the basic information for your marketing campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" placeholder="Enter campaign name" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type</Label>
              <Select>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_product_launch">New Product Launch</SelectItem>
                  <SelectItem value="seasonal_promo">Seasonal Promotion</SelectItem>
                  <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  <SelectItem value="lead_gen">Lead Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="objective">Primary Objective</Label>
              <Select>
                <SelectTrigger id="objective">
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="leads">Lead Generation</SelectItem>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your campaign goals and strategy"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Create Campaign</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
