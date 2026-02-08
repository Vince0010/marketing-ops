import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketerAction, AIAlert, KanbanColumn as ColumnType, TaskPhaseHistory } from '../../types/actions';
import type { ExecutionPhase } from '../../types/phase';
import ActionCard from './ActionCard';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
  column: ColumnType;
  actions: MarketerAction[];
  alerts: AIAlert[];
  phaseHistory: TaskPhaseHistory[];
  phases: ExecutionPhase[];
  onRevert?: (actionId: string) => void;
  onViewDetails?: (actionId: string) => void;
}

export default function KanbanColumn({
  column,
  actions,
  alerts,
  phaseHistory,
  phases,
  onRevert,
  onViewDetails,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Find alerts for actions in this column
  const getAlertForAction = (actionId: string): AIAlert | undefined => {
    return alerts.find(
      (alert) => alert.correlation_data.trigger_action_id === actionId && alert.status === 'active'
    );
  };

  // Get phase history for a specific action (completed phases only)
  const getHistoryForAction = (actionId: string): TaskPhaseHistory[] => {
    return phaseHistory.filter(
      (h) => h.action_id === actionId && h.exited_at !== null
    );
  };

  // Get current phase for an action
  const getCurrentPhase = (action: MarketerAction): ExecutionPhase | undefined => {
    if (!action.phase_id) return undefined;
    return phases.find((p) => p.id === action.phase_id);
  };

  // Calculate total time spent in this phase
  const totalTimeMinutes = actions.reduce((sum, action) => {
    return sum + (action.time_in_phase_minutes || 0);
  }, 0);
  
  const totalTimeHours = (totalTimeMinutes / 60).toFixed(1);
  
  // Calculate estimated vs actual for this column
  const totalEstimatedHours = actions.reduce((sum, action) => {
    return sum + (action.estimated_time_hours || 0);
  }, 0);
  
  // Get phase info if available
  const phase = column.phase;
  const plannedDurationHours = phase ? phase.planned_duration_days * 24 : null;
  
  // Calculate drift if phase exists
  const hasDrift = phase && totalTimeHours !== '0.0';
  const driftHours = plannedDurationHours ? parseFloat(totalTimeHours) - plannedDurationHours : 0;
  const isDriftPositive = driftHours < 0;
  const isDriftNegative = driftHours > 0;

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px]">
      {/* Column Header */}
      <Card className={cn('p-3 mb-2', column.color)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-gray-900">{column.label}</h3>
          <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full">
            {actions.length}
          </span>
        </div>
        
        {/* Phase Metrics */}
        {phase && totalTimeHours !== '0.0' && (
          <div className="space-y-1 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Total Time:
              </span>
              <span className="font-medium text-gray-900">
                {totalTimeHours}h
              </span>
            </div>
            
            {plannedDurationHours && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Planned:</span>
                <span className="text-gray-700">
                  {plannedDurationHours}h ({phase.planned_duration_days}d)
                </span>
              </div>
            )}
            
            {hasDrift && Math.abs(driftHours) > 1 && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-600">Drift:</span>
                <Badge 
                  variant={isDriftNegative ? "destructive" : "default"}
                  className={cn(
                    "h-5 text-xs",
                    isDriftPositive && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {isDriftPositive && <TrendingUp className="h-3 w-3 mr-0.5" />}
                  {isDriftNegative && <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {driftHours > 0 ? '+' : ''}{driftHours.toFixed(1)}h
                </Badge>
              </div>
            )}
          </div>
        )}
        
        {/* Backlog column doesn't have phase metrics */}
        {!phase && totalTimeHours !== '0.0' && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Estimated:
              </span>
              <span className="font-medium text-gray-900">
                {totalEstimatedHours.toFixed(1)}h
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] p-3 rounded-lg transition-colors',
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-gray-50 border-2 border-transparent'
        )}
      >
        <SortableContext
          items={actions.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {actions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No actions in this stage
            </div>
          ) : (
            actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                alert={getAlertForAction(action.id)}
                currentPhase={getCurrentPhase(action)}
                phaseHistory={getHistoryForAction(action.id)}
                onRevert={onRevert}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
