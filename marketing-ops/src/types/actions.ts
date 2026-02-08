// Marketer action types for Kanban board tracking
import type { ExecutionPhase, PhaseType } from './phase'

export type ActionType = 
  | 'creative_change'
  | 'budget_adjustment'
  | 'audience_targeting'
  | 'ad_copy_update'
  | 'posting_schedule_change'
  | 'bidding_strategy'
  | 'placement_change'
  | 'other';

export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'reverted';

export type CorrelationImpact = 'positive' | 'negative' | 'neutral';

export interface ActionMetadata {
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  affected_ad_sets?: string[];
  affected_campaigns?: string[];
  budget_change?: {
    from: number;
    to: number;
    currency?: string;
  };
  targeting_change?: {
    added?: string[];
    removed?: string[];
  };
  [key: string]: any;
}

export interface MarketerAction {
  id: string;
  campaign_id: string;
  created_at: string;
  action_type: ActionType;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: ActionMetadata;
  status: ActionStatus;
  created_by: string;
  has_correlation?: boolean;
  correlation_impact?: CorrelationImpact;
  reverted_action_id?: string;
  reverted_at?: string;
  
  // Phase tracking (NEW)
  phase_id?: string | null;
  
  // Time tracking (NEW)
  estimated_time_hours?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  time_in_phase_minutes?: number;
}

export interface MarketerActionInsert {
  campaign_id: string;
  action_type: ActionType;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: ActionMetadata;
  status: ActionStatus;
  created_by: string;
  
  // Phase tracking (NEW)
  phase_id?: string | null;
  
  // Time tracking (NEW)
  estimated_time_hours?: number | null;
  started_at?: string | null;
  time_in_phase_minutes?: number;
}

// Performance metrics structure
export interface PerformanceMetrics {
  sales: number;
  roas: number;
  cpa: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr?: number;
  cvr?: number;
}

export interface PerformanceSnapshot {
  id: string;
  campaign_id: string;
  date: string;
  snapshot_time: string;
  metrics: PerformanceMetrics;
  data_source: string;
  change_from_previous_day?: Record<string, number>;
}

export interface PerformanceSnapshotInsert {
  campaign_id: string;
  date: string;
  snapshot_time?: string;
  metrics: PerformanceMetrics;
  data_source: string;
  change_from_previous_day?: Record<string, number>;
}

// AI Alert types
export type AlertSeverity = 'high' | 'medium' | 'low' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'dismissed';

export interface CorrelationData {
  trigger_action_id: string;
  affected_metrics: string[];
  time_window: string;
  confidence_score: number;
  metric_changes?: Record<string, number>;
}

export interface SuggestedAction {
  type: 'revert' | 'adjust' | 'pause' | 'duplicate' | 'monitor';
  target_action_id?: string;
  button_label: string;
  auto_executable: boolean;
  description?: string;
}

export interface AIAlert {
  id: string;
  campaign_id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  detected_at: string;
  correlation_data: CorrelationData;
  suggested_action: SuggestedAction;
  status: AlertStatus;
  resolved_at?: string;
  dismissed_at?: string;
}

export interface AIAlertInsert {
  campaign_id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  detected_at: string;
  correlation_data: CorrelationData;
  suggested_action: SuggestedAction;
  status: AlertStatus;
}

// Correlation tracking
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface Correlation {
  id: string;
  action_id: string;
  metric_snapshot_id: string;
  correlation_strength: number;
  confidence_level: ConfidenceLevel;
  ai_insight: string;
  time_delta_hours: number;
  created_at: string;
}

export interface CorrelationInsert {
  action_id: string;
  metric_snapshot_id: string;
  correlation_strength: number;
  confidence_level: ConfidenceLevel;
  ai_insight: string;
  time_delta_hours: number;
}

// Task phase history tracking (NEW)
export interface TaskPhaseHistory {
  id: string;
  action_id: string;
  phase_id: string;
  phase_name: string;
  entered_at: string;
  exited_at: string | null;
  time_spent_minutes: number | null;
  created_at: string;
}

export interface TaskPhaseHistoryInsert {
  action_id: string;
  phase_id: string;
  phase_name: string;
  entered_at: string;
  exited_at?: string | null;
  time_spent_minutes?: number | null;
}

// Action templates for quick creation
export interface ActionTemplate {
  id: string;
  category: 'creative' | 'targeting' | 'budget' | 'optimization';
  label: string;
  action_type: ActionType;
  title_template: string;
  description_template?: string;
  metadata_template?: Partial<ActionMetadata>;
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  // Creative Actions
  {
    id: 'creative_update',
    category: 'creative',
    label: 'Updated Ad Creative',
    action_type: 'creative_change',
    title_template: 'Updated ad creative',
    description_template: 'Changed creative assets for ad set',
  },
  {
    id: 'headline_change',
    category: 'creative',
    label: 'Changed Headline/Copy',
    action_type: 'ad_copy_update',
    title_template: 'Updated ad copy',
    description_template: 'Modified headline or ad copy text',
  },
  {
    id: 'cta_change',
    category: 'creative',
    label: 'Modified CTA Button',
    action_type: 'creative_change',
    title_template: 'Changed CTA button',
    description_template: 'Updated call-to-action button text or style',
  },
  {
    id: 'image_swap',
    category: 'creative',
    label: 'Swapped Product Image',
    action_type: 'creative_change',
    title_template: 'Changed product image',
    description_template: 'Replaced main product image in ad',
  },
  // Targeting Actions
  {
    id: 'audience_adjust',
    category: 'targeting',
    label: 'Adjusted Audience Parameters',
    action_type: 'audience_targeting',
    title_template: 'Modified audience targeting',
    description_template: 'Updated audience parameters and filters',
  },
  {
    id: 'geo_targeting',
    category: 'targeting',
    label: 'Changed Geographic Targeting',
    action_type: 'audience_targeting',
    title_template: 'Updated geographic targeting',
    description_template: 'Modified location targeting settings',
  },
  {
    id: 'demographic_change',
    category: 'targeting',
    label: 'Modified Demographic Filters',
    action_type: 'audience_targeting',
    title_template: 'Changed demographic targeting',
    description_template: 'Updated age, gender, or demographic filters',
  },
  {
    id: 'interest_targeting',
    category: 'targeting',
    label: 'Updated Interest Targeting',
    action_type: 'audience_targeting',
    title_template: 'Modified interest targeting',
    description_template: 'Changed interest-based targeting criteria',
  },
  // Budget Actions
  {
    id: 'budget_increase',
    category: 'budget',
    label: 'Increased Daily Budget',
    action_type: 'budget_adjustment',
    title_template: 'Increased daily budget',
    description_template: 'Raised daily spending limit',
  },
  {
    id: 'budget_decrease',
    category: 'budget',
    label: 'Decreased Daily Budget',
    action_type: 'budget_adjustment',
    title_template: 'Decreased daily budget',
    description_template: 'Lowered daily spending limit',
  },
  {
    id: 'budget_reallocation',
    category: 'budget',
    label: 'Reallocated Budget',
    action_type: 'budget_adjustment',
    title_template: 'Reallocated budget between ad sets',
    description_template: 'Moved budget allocation across ad sets',
  },
  // Optimization Actions
  {
    id: 'pause_ads',
    category: 'optimization',
    label: 'Paused Underperforming Ads',
    action_type: 'other',
    title_template: 'Paused underperforming ads',
    description_template: 'Disabled ads not meeting performance targets',
  },
  {
    id: 'duplicate_winning',
    category: 'optimization',
    label: 'Duplicated Winning Ad Sets',
    action_type: 'other',
    title_template: 'Duplicated top-performing ad set',
    description_template: 'Created copy of high-performing ad set',
  },
  {
    id: 'bidding_strategy',
    category: 'optimization',
    label: 'Changed Bidding Strategy',
    action_type: 'bidding_strategy',
    title_template: 'Updated bidding strategy',
    description_template: 'Modified bid optimization settings',
  },
];

// Column configuration for Kanban board
export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  icon?: string;
  phase?: ExecutionPhase;
}

// Legacy status-based columns (deprecated, use createPhaseColumns instead)
export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'planned',
    label: 'Planned Actions',
    color: 'bg-gray-100 border-gray-300',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    color: 'bg-blue-50 border-blue-300',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'bg-green-50 border-green-300',
  },
  {
    id: 'reverted',
    label: 'Reverted',
    color: 'bg-orange-50 border-orange-300',
  },
];

// Helper to get color by phase type
export const getPhaseColor = (phaseType: PhaseType): string => {
  const colorMap: Record<string, string> = {
    planning: 'bg-purple-50 border-purple-300',
    creative: 'bg-pink-50 border-pink-300',
    compliance: 'bg-yellow-50 border-yellow-300',
    setup: 'bg-cyan-50 border-cyan-300',
    launch: 'bg-green-50 border-green-300',
    optimization: 'bg-blue-50 border-blue-300',
    reporting: 'bg-slate-50 border-slate-300',
  };
  return colorMap[phaseType] || 'bg-gray-50 border-gray-300';
};

// Create phase-based kanban columns from execution phases
export const createPhaseColumns = (phases: ExecutionPhase[]): KanbanColumn[] => {
  return [
    {
      id: 'backlog',
      label: 'Backlog',
      color: 'bg-gray-100 border-gray-300',
    },
    ...phases.map(phase => ({
      id: phase.id,
      label: phase.phase_name,
      color: getPhaseColor(phase.phase_type),
      phase,
    })),
  ];
};