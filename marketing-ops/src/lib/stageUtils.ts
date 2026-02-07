import type { StageConfig, ExecutionPhaseInsert } from '@/types/phase'

export function stagesToPhaseInserts(
  stages: StageConfig[],
  campaignId: string,
  campaignStartDate: string
): ExecutionPhaseInsert[] {
  let currentDate = new Date(campaignStartDate)

  return stages.map((stage, i) => {
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + stage.planned_duration_days)
    currentDate = new Date(endDate)

    return {
      campaign_id: campaignId,
      phase_number: i + 1,
      phase_name: stage.phase_name,
      phase_type: stage.phase_type,
      planned_start_date: startDate.toISOString().split('T')[0],
      planned_end_date: endDate.toISOString().split('T')[0],
      planned_duration_days: stage.planned_duration_days,
      status: 'pending' as const,
      owner: stage.owner || undefined,
      dependencies: stage.dependencies.length ? stage.dependencies : undefined,
      activities: stage.activities.length ? stage.activities : undefined,
      deliverables: stage.deliverables.length ? stage.deliverables : undefined,
      approvers: stage.approvers.length ? stage.approvers : undefined,
    }
  })
}
