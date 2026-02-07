export function calculateRiskScore(campaign: any): number {
  // Simplified risk calculation for hackathon
  let score = 100
  
  // Budget risk
  if (campaign.total_budget < 1000) score -= 20
  
  // Timeline risk
  const duration = new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()
  const durationDays = duration / (1000 * 60 * 60 * 24)
  if (durationDays < 14) score -= 15
  
  // First campaign risk
  if (!campaign.historical_context?.similar_campaigns?.length) score -= 10
  
  return Math.max(0, Math.min(100, score))
}

export function calculateDriftDays(plannedDays: number, actualDays: number): number {
  return actualDays - plannedDays
}

export function getDriftType(driftDays: number): 'positive' | 'negative' | 'neutral' {
  if (driftDays < -1) return 'positive'
  if (driftDays > 1) return 'negative'
  return 'neutral'
}

export function getGateDecision(riskScore: number): 'proceed' | 'adjust' | 'pause' {
  if (riskScore >= 70) return 'proceed'
  if (riskScore >= 50) return 'adjust'
  return 'pause'
}
