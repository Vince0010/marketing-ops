/**
 * Simulate mode: run the campaign flow without Supabase.
 * Data is stored in sessionStorage so you can test the UI while the DB is not ready.
 */

export const SIMULATE_CAMPAIGN_ID = 'simulate'

const STORAGE_KEY = 'marketing_ops_simulate'

export interface PhaseStatusChange {
  phaseId: string
  phaseName: string
  from: string
  to: string
  at: string
}

export interface SimulatePayload {
  campaign: Record<string, unknown>
  phases: Record<string, unknown>[]
  status_changes?: PhaseStatusChange[]
}

export function saveSimulatePayload(payload: SimulatePayload): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('Simulate: could not save to sessionStorage', e)
  }
}

export function loadSimulatePayload(): SimulatePayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SimulatePayload
  } catch {
    return null
  }
}

export function isSimulateId(id: string | undefined): boolean {
  return id === SIMULATE_CAMPAIGN_ID
}
