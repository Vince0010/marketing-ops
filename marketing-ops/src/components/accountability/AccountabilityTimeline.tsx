import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  Plus,
  PieChart,
} from 'lucide-react'
import type { StakeholderAction } from '@/types/database'
import { 
  calculateAccountabilitySummary, 
  getDelayBreakdown,
  createStakeholderAction,
  completeStakeholderAction 
} from '@/services/accountabilityService'

interface AccountabilityTimelineProps {
  campaignId: string
  actions: StakeholderAction[]
  onActionCreated?: () => void
  onActionCompleted?: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AccountabilityTimeline({
  campaignId,
  actions,
  onActionCreated,
  onActionCompleted
}: AccountabilityTimelineProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    action_type: 'approval',
    action_description: '',
    stakeholder_name: '',
    stakeholder_role: '',
    stakeholder_type: 'client' as 'client' | 'agency' | 'external',
    requested_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    critical_path: false,
    notes: ''
  })

  const summary = calculateAccountabilitySummary(actions)
  const delayBreakdown = getDelayBreakdown(actions)

  const handleSubmit = async () => {
    if (!formData.action_description || !formData.stakeholder_name) {
      alert('Please fill in required fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await createStakeholderAction({
        campaign_id: campaignId,
        action_type: formData.action_type,
        action_description: formData.action_description,
        stakeholder_name: formData.stakeholder_name,
        stakeholder_role: formData.stakeholder_role,
        stakeholder_type: formData.stakeholder_type,
        requested_date: formData.requested_date,
        expected_date: formData.expected_date || undefined,
        status: 'pending',
        critical_path: formData.critical_path,
        notes: formData.notes || undefined,
        logged_by: 'current_user',
        logged_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error creating action:', error)
        alert('Failed to create action')
      } else {
        setAddDialogOpen(false)
        setFormData({
          action_type: 'approval',
          action_description: '',
          stakeholder_name: '',
          stakeholder_role: '',
          stakeholder_type: 'client',
          requested_date: new Date().toISOString().split('T')[0],
          expected_date: '',
          critical_path: false,
          notes: ''
        })
        onActionCreated?.()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (actionId: string) => {
    const { error } = await completeStakeholderAction(actionId)
    if (error) {
      console.error('Error completing action:', error)
      alert('Failed to complete action')
    } else {
      onActionCompleted?.()
    }
  }

  const getActorColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-expedition-summit/10 border-expedition-summit/30 text-expedition-navy dark:text-white'
      case 'agency':
        return 'bg-expedition-trail/10 border-expedition-trail/30 text-expedition-navy dark:text-white'
      case 'external':
        return 'bg-muted border-border text-foreground'
      default:
        return 'bg-muted border-border text-foreground'
    }
  }

  const getAttributionColor = (attribution: string) => {
    switch (attribution) {
      case 'client':
        return 'bg-expedition-summit text-white'
      case 'agency':
        return 'bg-expedition-trail text-white'
      case 'external':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{summary.total_actions}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time %</p>
                <p className="text-2xl font-bold">{summary.on_time_percentage}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delay Attribution */}
      {delayBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Delay Attribution
            </CardTitle>
            <CardDescription>
              Who is responsible for delays (client vs agency accountability)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {delayBreakdown.map((item) => (
                <div key={item.attribution} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={getAttributionColor(item.attribution || 'unknown')}>
                        {item.attribution ? item.attribution.charAt(0).toUpperCase() + item.attribution.slice(1) : 'Unknown'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {item.count} delay{item.count !== 1 ? 's' : ''} • {item.total_days} days total
                      </span>
                    </div>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground">Client Delays</p>
                    <p className="text-lg font-bold text-expedition-summit">{summary.client_delays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Agency Delays</p>
                    <p className="text-lg font-bold text-expedition-trail">{summary.agency_delays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">External Delays</p>
                    <p className="text-lg font-bold text-gray-600">{summary.external_delays}</p>
                  </div>
                </div>
              </div>

              {summary.avg_delay_days > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Average delay: <span className="font-medium text-foreground">{summary.avg_delay_days} days</span>
                  </p>
                  {summary.critical_path_delays > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ {summary.critical_path_delays} critical path delay{summary.critical_path_delays !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Stakeholder Actions Timeline
              </CardTitle>
              <CardDescription>
                Track approvals, reviews, and stakeholder dependencies
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Stakeholder Action</DialogTitle>
                  <DialogDescription>
                    Track approvals, reviews, deliverables, and other stakeholder dependencies
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="action_type">Action Type</Label>
                      <Select
                        value={formData.action_type}
                        onValueChange={(v) => setFormData({ ...formData, action_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approval">Approval</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="decision">Decision</SelectItem>
                          <SelectItem value="sign_off">Sign-Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stakeholder_type">Stakeholder Type</Label>
                      <Select
                        value={formData.stakeholder_type}
                        onValueChange={(v) => setFormData({ ...formData, stakeholder_type: v as 'client' | 'agency' | 'external' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                          <SelectItem value="external">External (Legal, Vendor, etc.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action_description">Action Description *</Label>
                    <Input
                      id="action_description"
                      placeholder="e.g., Approve final creative concepts"
                      value={formData.action_description}
                      onChange={(e) => setFormData({ ...formData, action_description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stakeholder_name">Stakeholder Name *</Label>
                      <Input
                        id="stakeholder_name"
                        placeholder="e.g., Sarah Johnson"
                        value={formData.stakeholder_name}
                        onChange={(e) => setFormData({ ...formData, stakeholder_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stakeholder_role">Role</Label>
                      <Input
                        id="stakeholder_role"
                        placeholder="e.g., Marketing Director"
                        value={formData.stakeholder_role}
                        onChange={(e) => setFormData({ ...formData, stakeholder_role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requested_date">Requested Date</Label>
                      <Input
                        id="requested_date"
                        type="date"
                        value={formData.requested_date}
                        onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_date">Expected Date</Label>
                      <Input
                        id="expected_date"
                        type="date"
                        value={formData.expected_date}
                        onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="critical_path"
                      checked={formData.critical_path}
                      onChange={(e) => setFormData({ ...formData, critical_path: e.target.checked })}
                      className="rounded border-input"
                    />
                    <Label htmlFor="critical_path" className="cursor-pointer">
                      This is on the critical path (blocks campaign progress)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional context or requirements..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Logging...' : 'Log Action'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Stakeholder Actions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking approvals, reviews, and stakeholder dependencies
                </p>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log First Action
                </Button>
              </div>
            ) : (
              actions.map((action) => {
                const isOverdue =
                  action.status === 'overdue' ||
                  (action.expected_date &&
                    new Date(action.expected_date) < new Date() &&
                    action.status !== 'completed')

                return (
                  <div
                    key={action.id}
                    className={`border rounded-lg p-4 space-y-3 ${
                      isOverdue ? 'border-expedition-checkpoint/40 bg-expedition-checkpoint/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full text-sm border ${getActorColor(
                            action.stakeholder_type
                          )}`}
                        >
                          {action.stakeholder_type.charAt(0).toUpperCase() +
                            action.stakeholder_type.slice(1)}
                        </div>
                        <div>
                          <p className="font-semibold">{action.action_description}</p>
                          <p className="text-sm text-muted-foreground">
                            {action.stakeholder_name}
                            {action.stakeholder_role && ` (${action.stakeholder_role})`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            action.status === 'completed'
                              ? 'default'
                              : isOverdue
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {action.status === 'completed'
                            ? 'Completed'
                            : isOverdue
                            ? 'Overdue'
                            : action.status}
                        </Badge>
                        {isOverdue && action.overdue_days && (
                          <p className="text-xs text-expedition-checkpoint mt-1">
                            {action.overdue_days}d overdue
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Requested</span>
                        <p className="font-medium">{formatDate(action.requested_date)}</p>
                      </div>
                      {action.expected_date && (
                        <div>
                          <span className="text-muted-foreground">Expected</span>
                          <p className="font-medium">{formatDate(action.expected_date)}</p>
                        </div>
                      )}
                      {action.actual_date && (
                        <div>
                          <span className="text-muted-foreground">Completed</span>
                          <p className="font-medium">{formatDate(action.actual_date)}</p>
                        </div>
                      )}
                      {action.critical_path && (
                        <div>
                          <span className="text-muted-foreground">Critical Path</span>
                          <Badge variant="warning" className="border-expedition-signal/40">
                            Critical
                          </Badge>
                        </div>
                      )}
                    </div>

                    {action.delay_reason && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Delay Reason:</p>
                        <p className="text-sm text-muted-foreground">{action.delay_reason}</p>
                        {action.delay_attribution && (
                          <Badge className={`mt-2 ${getAttributionColor(action.delay_attribution)}`}>
                            Attribution: {action.delay_attribution}
                          </Badge>
                        )}
                      </div>
                    )}

                    {action.delay_impact && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Impact:
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          {action.delay_impact}
                        </p>
                      </div>
                    )}

                    {action.notes && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {action.notes}
                      </div>
                    )}

                    {action.status !== 'completed' && (
                      <div className="pt-2 border-t flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(action.id)}
                          className="gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
