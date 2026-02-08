import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, RefreshCw } from 'lucide-react';
import {
  type AIAlert,
  type MarketerActionInsert,
  type MarketerAction,
  type TaskPhaseHistory,
  createPhaseColumns,
} from '../../types/actions';
import type { ExecutionPhase } from '../../types/phase';
import KanbanColumn from './KanbanColumn';
import ActionCard from './ActionCard';
import ActionCardEditor from './ActionCardEditor';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useCampaignExecution } from '../../hooks/useCampaignExecution';

/**
 * Optional external execution data to share state with parent (e.g., CampaignTracker)
 * When provided, KanbanBoard uses this data instead of its own hook instance
 */
interface ExternalExecutionData {
  phases: ExecutionPhase[];
  tasks: MarketerAction[];
  history: TaskPhaseHistory[];
  loading: boolean;
  error: string | null;
  createTask: (taskData: MarketerActionInsert) => Promise<MarketerAction>;
  moveTaskToPhase: (taskId: string, newPhaseId: string | null, oldPhaseId: string | null) => Promise<MarketerAction>;
  refetch: () => Promise<void>;
}

interface KanbanBoardProps {
  campaignId: string;
  /** Optional external execution data to share state with parent component */
  externalData?: ExternalExecutionData;
}

export default function KanbanBoard({ campaignId, externalData }: KanbanBoardProps) {
  // Use external data if provided (shares state with parent), otherwise use own hook
  const ownHook = useCampaignExecution(externalData ? undefined : campaignId);

  const {
    phases,
    tasks,
    history,
    loading: executionLoading,
    error: executionError,
    createTask,
    moveTaskToPhase,
    refetch,
  } = externalData || ownHook;

  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Generate columns from phases
  const columns = useMemo(() => {
    return phases.length > 0 ? createPhaseColumns(phases) : []
  }, [phases])

  // Overall loading state
  const loading = executionLoading || alertsLoading
  const error = executionError

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch alerts (tasks/phases/history handled by useCampaignExecution)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true)
        const { data, error } = await supabase
          .from('ai_alerts')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'active')
          .order('detected_at', { ascending: false })

        if (error) throw error
        setAlerts(data || [])
      } catch (err) {
        console.error('[KanbanBoard] Error fetching alerts:', err)
      } finally {
        setAlertsLoading(false)
      }
    }

    fetchAlerts()

    // Subscribe to alerts changes
    const alertsChannel = supabase
      .channel('ai_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_alerts',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('[KanbanBoard] ai_alerts subscription triggered:', payload.eventType)
          fetchAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(alertsChannel)
    }
  }, [campaignId]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the action being dragged
    const activeAction = tasks.find((a) => a.id === activeId);
    if (!activeAction) return;

    // Check if dropped on a column (phase change)
    const targetColumn = columns.find((col) => col.id === overId);
    if (!targetColumn) return;

    const newPhaseId = targetColumn.id === 'backlog' ? null : targetColumn.id;
    const oldPhaseId = activeAction.phase_id;

    // No change if same phase
    if (oldPhaseId === newPhaseId) return;

    try {
      console.log('[KanbanBoard] Moving task via hook:', {
        actionId: activeId,
        from: oldPhaseId || 'backlog',
        to: newPhaseId || 'backlog'
      })

      // Use hook method for immediate local update
      await moveTaskToPhase(activeId, newPhaseId, oldPhaseId || null)

      console.log('[KanbanBoard] Task moved successfully')
    } catch (err) {
      console.error('[KanbanBoard] Error moving task:', err);
      alert('Failed to move task');
    }
  };

  // Handle creating a new action
  const handleCreateAction = async (actionData: MarketerActionInsert) => {
    try {
      console.log('[KanbanBoard] Creating new task via hook:', actionData.title)

      // Use hook method for immediate local update
      await createTask(actionData)

      console.log('[KanbanBoard] Task created successfully')
    } catch (err) {
      console.error('[KanbanBoard] Error creating task:', err);
      throw err;
    }
  };

  // Handle reverting an action
  const handleRevert = async (actionId: string) => {
    const action = tasks.find((a) => a.id === actionId);
    if (!action) return;

    const confirmed = confirm(
      `Are you sure you want to revert "${action.title}"? This will create a reversal action.`
    );
    if (!confirmed) return;

    try {
      // Create a revert action
      const revertAction: MarketerActionInsert = {
        campaign_id: action.campaign_id,
        action_type: action.action_type,
        title: `Reverted: ${action.title}`,
        description: `Reverted action due to performance impact`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        created_by: action.created_by,
        metadata: {
          ...action.metadata,
          reverted_from: action.id,
        },
      };

      const { error: createError } = await supabase
        .from('marketer_actions')
        .insert([revertAction]);

      if (createError) throw createError;

      // Update original action to reverted status
      const { error: updateError } = await supabase
        .from('marketer_actions')
        .update({
          status: 'reverted',
          reverted_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      if (updateError) throw updateError;

      // Resolve the alert
      const alert = alerts.find(
        (a) => a.correlation_data.trigger_action_id === actionId
      );
      if (alert) {
        await supabase
          .from('ai_alerts')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', alert.id);
      }

      // Let subscription handle the refresh
    } catch (err) {
      console.error('Error reverting action:', err);
      alert('Failed to revert action');
    }
  };

  // Handle viewing action details
  const handleViewDetails = (actionId: string) => {
    // TODO: Implement detail view modal
    console.log('View details for action:', actionId);
  };

  // Get active action for drag overlay
  const activeAction = activeId
    ? tasks.find((a) => a.id === activeId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Action Tracking</h2>
          <p className="text-sm text-gray-600">
            Track marketer actions and their impact on campaign performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void refetch() }}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Action
          </Button>
        </div>
      </div>

      {/* Active Alerts Summary */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.length} active alert{alerts.length > 1 ? 's' : ''} detected.
            Check cards below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No execution phases defined for this campaign.</p>
              <p className="text-sm mt-2">Create phases in the campaign setup to start tracking tasks.</p>
            </div>
          ) : (
            columns.map((column) => {
              // Filter actions by phase
              const columnActions = column.id === 'backlog'
                ? tasks.filter((a) => !a.phase_id)
                : tasks.filter((a) => a.phase_id === column.id);

              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  actions={columnActions}
                  alerts={alerts}
                  phaseHistory={history}
                  phases={phases}
                  onRevert={handleRevert}
                  onViewDetails={handleViewDetails}
                />
              );
            })
          )}
        </div>

        <DragOverlay>
          {activeAction ? (
            <div className="cursor-grabbing">
              <ActionCard
                action={activeAction}
                alert={alerts.find(
                  (a) => a.correlation_data.trigger_action_id === activeAction.id
                )}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Action Editor Modal */}
      <ActionCardEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleCreateAction}
        campaignId={campaignId}
      />
    </div>
  );
}
