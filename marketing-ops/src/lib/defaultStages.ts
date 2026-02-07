import type { StageConfig } from '@/types/phase'

const STAGE_DEFAULTS: Array<Pick<StageConfig, 'phase_name' | 'phase_type' | 'planned_duration_days'>> = [
  { phase_name: 'Planning', phase_type: 'planning', planned_duration_days: 5 },
  { phase_name: 'Creative Development', phase_type: 'creative', planned_duration_days: 7 },
  { phase_name: 'Compliance & Approval', phase_type: 'compliance', planned_duration_days: 3 },
  { phase_name: 'Technical Setup', phase_type: 'setup', planned_duration_days: 2 },
  { phase_name: 'Launch', phase_type: 'launch', planned_duration_days: 1 },
  { phase_name: 'Optimization', phase_type: 'optimization', planned_duration_days: 14 },
  { phase_name: 'Reporting', phase_type: 'reporting', planned_duration_days: 3 },
]

export function createDefaultStages(): StageConfig[] {
  return STAGE_DEFAULTS.map((d, i) => ({
    tempId: crypto.randomUUID(),
    phase_number: i + 1,
    phase_name: d.phase_name,
    phase_type: d.phase_type,
    planned_duration_days: d.planned_duration_days,
    owner: '',
    activities: [],
    deliverables: [],
    approvers: [],
    dependencies: [],
  }))
}
