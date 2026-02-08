import type { AgeRow } from '@/components/demographics/DemographicAlignmentTracker'

export const DEMO_AGE_DATA: AgeRow[] = [
  { range: '18-24', goal: 25, actual: 3, diff: -22 },
  { range: '25-34', goal: 35, actual: 50, diff: 15 },
  { range: '35-44', goal: 25, actual: 28, diff: 3 },
  { range: '45-54', goal: 10, actual: 14, diff: 4 },
  { range: '55+', goal: 5, actual: 5, diff: 0 },
]

export const DEMO_FIT_SCORE = 78

export const DEMO_STRONG_ALIGNMENT = [
  '25-34 demographic over-indexing by 12%',
  'Female audience engagement exceeds targets',
]

export const DEMO_ADJUSTMENT_AREAS = [
  '18-24 demographic underperforming by 25%',
  'Midwest region below expected performance',
]

export const DEMO_RECOMMENDED_ACTIONS = [
  'Increase budget allocation for 25-34 creative variants',
  'Test new messaging approaches for 18-24 audience',
  'Consider geographic reallocation for underperforming regions',
]
