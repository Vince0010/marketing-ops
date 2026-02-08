import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  User,
  Undo2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import type { MarketerAction, AIAlert, TaskPhaseHistory } from '../../types/actions';
import type { ExecutionPhase } from '../../types/phase';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { calculateTaskHealthInCurrentPhase, formatTimeFromMinutes } from '../../utils/calculations';

interface ActionCardProps {
  action: MarketerAction;
  alert?: AIAlert;
  currentPhase?: ExecutionPhase; // Phase the task is currently in
  phaseHistory?: TaskPhaseHistory[]; // History of phases this task completed
  onRevert?: (actionId: string) => void;
  onViewDetails?: (actionId: string) => void;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  creative_change: '🎨 Creative Change',
  budget_adjustment: '💰 Budget Adjustment',
  audience_targeting: '🎯 Audience Targeting',
  ad_copy_update: '✍️ Ad Copy Update',
  posting_schedule_change: '⏰ Schedule Change',
  bidding_strategy: '📊 Bidding Strategy',
  placement_change: '📱 Placement Change',
  other: '⚙️ Other Action',
};

export default function ActionCard({ 
  action, 
  alert,
  currentPhase,
  phaseHistory = [],
  onRevert,
  onViewDetails 
}: ActionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate current phase health if in a phase
  const currentPhaseHealth = currentPhase && action.time_in_phase_minutes
    ? calculateTaskHealthInCurrentPhase(action.time_in_phase_minutes, currentPhase.planned_duration_days)
    : null;

  // Determine card styling based on phase health or correlation
  const getCardStyle = () => {
    // Priority: phase health (overdue/at-risk) > correlation
    if (currentPhaseHealth) {
      if (currentPhaseHealth === 'overdue') return 'border-red-400 bg-red-50';
      if (currentPhaseHealth === 'at-risk') return 'border-yellow-400 bg-yellow-50';
      return 'border-green-300 bg-green-50';
    }
    
    if (!action.has_correlation) return 'border-gray-200 bg-white';
    
    switch (action.correlation_impact) {
      case 'positive':
        return 'border-green-300 bg-green-50';
      case 'negative':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getImpactIcon = () => {
    if (!action.correlation_impact) return null;
    
    switch (action.correlation_impact) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getPhaseHealthBadge = () => {
    if (!currentPhaseHealth) return null;
    
    const config = {
      'on-time': { label: 'On-time', className: 'bg-green-600', icon: CheckCircle2 },
      'at-risk': { label: 'At-risk', className: 'bg-yellow-600', icon: AlertCircle },
      'overdue': { label: 'Overdue', className: 'bg-red-600', icon: AlertTriangle }
    };
    
    const { label, className, icon: Icon } = config[currentPhaseHealth];
    
    return (
      <Badge className={cn('text-xs', className)}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group mb-3',
        isDragging && 'opacity-50'
      )}
    >
      <Card className={cn('p-3 shadow-sm hover:shadow-md transition-shadow', getCardStyle())}>
        {/* Header with drag handle */}
        <div className="flex items-start gap-2 mb-2">
          <button
            className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {ACTION_TYPE_LABELS[action.action_type] || action.action_type}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {action.title}
                </p>
              </div>
              {getImpactIcon()}
            </div>
            
            {action.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {action.description}
              </p>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div className={cn(
            'mt-2 p-2 rounded-md border',
            alert.severity === 'high' && 'bg-red-100 border-red-300',
            alert.severity === 'medium' && 'bg-yellow-100 border-yellow-300',
            alert.severity === 'low' && 'bg-blue-100 border-blue-300'
          )}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0',
                alert.severity === 'high' && 'text-red-600',
                alert.severity === 'medium' && 'text-yellow-600',
                alert.severity === 'low' && 'text-blue-600'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900">
                  {alert.title}
                </p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {alert.correlation_data.affected_metrics.join(', ')} affected
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Confidence: {Math.round(alert.correlation_data.confidence_score * 100)}%
                </p>
              </div>
            </div>
            
            {/* Alert Actions */}
            <div className="flex gap-2 mt-2">
              {alert.suggested_action.type === 'revert' && onRevert && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => onRevert(action.id)}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  {alert.suggested_action.button_label}
                </Button>
              )}
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onViewDetails(action.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Metadata Display */}
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
          {/* Phase Guideline & Current Time */}
          {currentPhase && action.time_in_phase_minutes !== undefined && action.time_in_phase_minutes > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700 font-medium flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {currentPhase.phase_name} guideline:
                </span>
                <span className="text-blue-900 font-semibold">
                  {currentPhase.planned_duration_days}d
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-700">Time in this phase:</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold",
                    currentPhaseHealth === 'overdue' && "text-red-600",
                    currentPhaseHealth === 'at-risk' && "text-yellow-600",
                    currentPhaseHealth === 'on-time' && "text-green-600"
                  )}>
                    {formatTimeFromMinutes(action.time_in_phase_minutes)}
                  </span>
                  {getPhaseHealthBadge()}
                </div>
              </div>
            </div>
          )}
          
          {/* Phase completion history */}
          {phaseHistory.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Completed {phaseHistory.length} phase{phaseHistory.length !== 1 ? 's' : ''}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    {phaseHistory.map((h) => (
                      <div key={h.id} className="text-xs flex justify-between gap-3">
                        <span className="font-medium">✓ {h.phase_name}:</span>
                        <span>{h.time_spent_minutes ? formatTimeFromMinutes(h.time_spent_minutes) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Original metadata */}
          {action.metadata && Object.keys(action.metadata).length > 0 && (
            <>
              {action.metadata.budget_change && (
                <p className="text-xs text-gray-600">
                  Budget: ${action.metadata.budget_change.from} → ${action.metadata.budget_change.to}
                </p>
              )}
              {action.metadata.affected_ad_sets && action.metadata.affected_ad_sets.length > 0 && (
                <p className="text-xs text-gray-600">
                  Ad Sets: {action.metadata.affected_ad_sets.length}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer with timestamp and user */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(action.timestamp), 'MMM d, h:mm a')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span>{action.created_by.split('@')[0]}</span>
          </div>
        </div>

        {/* Reverted indicator */}
        {action.status === 'reverted' && action.reverted_at && (
          <div className="mt-2 p-1.5 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800 flex items-center gap-1">
            <Undo2 className="h-3 w-3" />
            Reverted on {format(new Date(action.reverted_at), 'MMM d, h:mm a')}
          </div>
        )}
      </Card>
    </div>
  );
}
