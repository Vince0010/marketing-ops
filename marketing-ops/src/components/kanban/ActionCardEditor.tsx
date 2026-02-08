import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  type ActionType,
  type ActionStatus,
  type ActionTemplate,
  ACTION_TEMPLATES,
  type MarketerActionInsert,
} from '../../types/actions';
import { type ExecutionPhase } from '../../types/phase';
import { supabase } from '../../lib/supabase';

interface ActionCardEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (action: MarketerActionInsert) => Promise<void>;
  campaignId: string;
  defaultStatus?: ActionStatus;
}

export default function ActionCardEditor({
  open,
  onClose,
  onSave,
  campaignId,
  defaultStatus = 'planned',
}: ActionCardEditorProps) {
  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<ExecutionPhase[]>([]);
  const [formData, setFormData] = useState<{
    action_type: ActionType;
    title: string;
    description: string;
    status: ActionStatus;
    created_by: string;
    phase_id: string;
    estimated_time_hours: string;
  }>({
    action_type: 'creative_change',
    title: '',
    description: '',
    status: defaultStatus,
    created_by: 'user@marketing.com',
    phase_id: '',
    estimated_time_hours: '',
  });

  // Fetch execution phases
  useEffect(() => {
    const fetchPhases = async () => {
      if (!campaignId || !open) return;
      
      const { data, error } = await supabase
        .from('execution_phases')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('phase_number');

      if (error) {
        console.error('Error fetching phases:', error);
      } else if (data && data.length > 0) {
        setPhases(data);
        // Set first phase as default
        if (!formData.phase_id) {
          setFormData(prev => ({ ...prev, phase_id: data[0].id }));
        }
      }
    };

    fetchPhases();
  }, [campaignId, open]);

  const handleTemplateSelect = (template: ActionTemplate) => {
    setFormData({
      ...formData,
      action_type: template.action_type,
      title: template.title_template,
      description: template.description_template || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.estimated_time_hours || parseFloat(formData.estimated_time_hours) <= 0) {
      alert('Please enter a valid estimated time (hours)');
      return;
    }

    if (!formData.phase_id) {
      alert('Please select a workflow phase');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const newAction: MarketerActionInsert = {
        campaign_id: campaignId,
        action_type: formData.action_type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        timestamp: now,
        status: formData.status,
        created_by: formData.created_by,
        metadata: {},
        // Phase tracking
        phase_id: formData.phase_id,
        // Time tracking
        estimated_time_hours: parseFloat(formData.estimated_time_hours),
        started_at: now,
        time_in_phase_minutes: 0,
      };

      await onSave(newAction);
      
      // Reset form
      setFormData({
        action_type: 'creative_change',
        title: '',
        description: '',
        status: defaultStatus,
        created_by: 'user@marketing.com',
        phase_id: phases[0]?.id || '',
        estimated_time_hours: '',
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Failed to save action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Group templates by category
  const templatesByCategory = ACTION_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ActionTemplate[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Create New Action
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="custom" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates">Quick Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom Action</TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <p className="text-sm text-gray-600">
                Select a pre-filled template to quickly create common actions
              </p>

              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                    {category} Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div>
                          <p className="font-medium text-sm">{template.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {template.title_template}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Custom Action Tab */}
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="action_type">Action Type</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(value) => handleChange('action_type', value)}
                  >
                    <SelectTrigger id="action_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creative_change">Creative Change</SelectItem>
                      <SelectItem value="budget_adjustment">Budget Adjustment</SelectItem>
                      <SelectItem value="audience_targeting">Audience Targeting</SelectItem>
                      <SelectItem value="ad_copy_update">Ad Copy Update</SelectItem>
                      <SelectItem value="posting_schedule_change">Schedule Change</SelectItem>
                      <SelectItem value="bidding_strategy">Bidding Strategy</SelectItem>
                      <SelectItem value="placement_change">Placement Change</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Changed hero image from blue to red"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Provide additional details about this action..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="phase_id">Workflow Phase *</Label>
                  <Select
                    value={formData.phase_id}
                    onValueChange={(value) => handleChange('phase_id', value)}
                  >
                    <SelectTrigger id="phase_id">
                      <SelectValue placeholder="Select a phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phases.length === 0 && (
                        <SelectItem value="none" disabled>
                          No phases available
                        </SelectItem>
                      )}
                      {phases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.phase_number}. {phase.phase_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Which phase of the workflow is this task for?
                  </p>
                </div>

                <div>
                  <Label htmlFor="estimated_time_hours">Estimated Time (hours) *</Label>
                  <Input
                    id="estimated_time_hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.estimated_time_hours}
                    onChange={(e) => handleChange('estimated_time_hours', e.target.value)}
                    placeholder="e.g., 2.5"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long do you estimate this task will take?
                  </p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value as ActionStatus)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="created_by">Created By</Label>
                  <Input
                    id="created_by"
                    type="email"
                    value={formData.created_by}
                    onChange={(e) => handleChange('created_by', e.target.value)}
                    placeholder="user@marketing.com"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Preview */}
          {formData.title && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Preview</p>
              <p className="text-sm font-medium text-gray-900">{formData.title}</p>
              {formData.description && (
                <p className="text-xs text-gray-600 mt-1">{formData.description}</p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Creating...' : 'Create Action'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
