-- Migration: Add Phase Tracking and Time Tracking to Marketer Actions
-- Date: 2026-02-08
-- Description: Transforms the execution timeline into a task-based kanban board
--              where phases are columns and tasks track time spent in each phase

-- ============================================================================
-- STEP 1: Add Phase Tracking & Time Tracking columns to marketer_actions
-- ============================================================================

-- Add phase relationship
ALTER TABLE marketer_actions 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES execution_phases(id) ON DELETE SET NULL;

-- Add time tracking fields
ALTER TABLE marketer_actions 
ADD COLUMN IF NOT EXISTS estimated_time_hours NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_in_phase_minutes INTEGER DEFAULT 0;

-- Create index for phase queries
CREATE INDEX IF NOT EXISTS idx_marketer_actions_phase_id 
ON marketer_actions(phase_id);

-- Create index for time queries
CREATE INDEX IF NOT EXISTS idx_marketer_actions_started_at 
ON marketer_actions(started_at) WHERE started_at IS NOT NULL;

-- ============================================================================
-- STEP 2: Create task_phase_history table for tracking time across phases
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_phase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES marketer_actions(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES execution_phases(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we don't have duplicate active entries
  CONSTRAINT unique_active_phase_entry UNIQUE (action_id, phase_id, entered_at)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_phase_history_action 
ON task_phase_history(action_id);

CREATE INDEX IF NOT EXISTS idx_task_phase_history_phase 
ON task_phase_history(phase_id);

CREATE INDEX IF NOT EXISTS idx_task_phase_history_dates 
ON task_phase_history(entered_at, exited_at);

-- ============================================================================
-- STEP 3: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN marketer_actions.phase_id IS 
'Foreign key to execution_phases. Associates task with a workflow phase for kanban tracking.';

COMMENT ON COLUMN marketer_actions.estimated_time_hours IS 
'Estimated time to complete this task in hours. Used for drift analysis.';

COMMENT ON COLUMN marketer_actions.started_at IS 
'Timestamp when task entered current phase. Updated on phase transition.';

COMMENT ON COLUMN marketer_actions.completed_at IS 
'Timestamp when task reached final phase and was marked completed.';

COMMENT ON COLUMN marketer_actions.time_in_phase_minutes IS 
'Running total of time spent in current phase (minutes). Reset on phase change.';

COMMENT ON TABLE task_phase_history IS 
'Tracks the history of tasks moving through phases. Each row represents time spent in one phase.';

-- ============================================================================
-- STEP 4: Create helper function to calculate phase drift from tasks
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_phase_drift(p_phase_id UUID)
RETURNS TABLE (
  phase_id UUID,
  phase_name TEXT,
  planned_duration_days INTEGER,
  actual_duration_hours NUMERIC,
  drift_hours NUMERIC,
  drift_days INTEGER,
  task_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.id as phase_id,
    ep.phase_name,
    ep.planned_duration_days,
    ROUND(SUM(COALESCE(tph.time_spent_minutes, 0)) / 60.0, 2) as actual_duration_hours,
    ROUND(SUM(COALESCE(tph.time_spent_minutes, 0)) / 60.0, 2) - (ep.planned_duration_days * 24) as drift_hours,
    ROUND((SUM(COALESCE(tph.time_spent_minutes, 0)) / 60.0 - ep.planned_duration_days * 24) / 24.0) as drift_days,
    COUNT(DISTINCT tph.action_id)::INTEGER as task_count
  FROM execution_phases ep
  LEFT JOIN task_phase_history tph ON ep.id = tph.phase_id
  WHERE ep.id = p_phase_id
    AND tph.exited_at IS NOT NULL -- Only count completed time in phase
  GROUP BY ep.id, ep.phase_name, ep.planned_duration_days;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_phase_drift IS 
'Calculates phase-level drift by aggregating task time from task_phase_history. Returns drift in hours and days.';

-- ============================================================================
-- STEP 5: Create trigger to auto-update time_in_phase_minutes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_time_in_phase()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate time in phase if started_at exists
  IF NEW.started_at IS NOT NULL THEN
    NEW.time_in_phase_minutes := EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drops existing if present)
DROP TRIGGER IF EXISTS trigger_update_time_in_phase ON marketer_actions;
CREATE TRIGGER trigger_update_time_in_phase
  BEFORE UPDATE ON marketer_actions
  FOR EACH ROW
  WHEN (NEW.started_at IS NOT NULL)
  EXECUTE FUNCTION update_time_in_phase();

COMMENT ON FUNCTION update_time_in_phase IS 
'Automatically updates time_in_phase_minutes when action is updated. Calculates from started_at to now.';

-- ============================================================================
-- STEP 6: Verification queries (commented out, run manually if needed)
-- ============================================================================

-- Verify new columns exist
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'marketer_actions' 
-- AND column_name IN ('phase_id', 'estimated_time_hours', 'started_at', 'completed_at', 'time_in_phase_minutes');

-- Verify task_phase_history table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'task_phase_history';

-- Test drift calculation function
-- SELECT * FROM calculate_phase_drift('<some_phase_id>');

-- ============================================================================
-- ROLLBACK (if needed, uncomment and run)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trigger_update_time_in_phase ON marketer_actions;
-- DROP FUNCTION IF EXISTS update_time_in_phase();
-- DROP FUNCTION IF EXISTS calculate_phase_drift(UUID);
-- DROP TABLE IF EXISTS task_phase_history;
-- DROP INDEX IF EXISTS idx_marketer_actions_started_at;
-- DROP INDEX IF EXISTS idx_marketer_actions_phase_id;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS time_in_phase_minutes;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS completed_at;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS started_at;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS estimated_time_hours;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS phase_id;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
