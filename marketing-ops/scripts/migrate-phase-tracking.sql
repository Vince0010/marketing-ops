-- Phase Tracking Migration for Kanban Board
-- This migration adds time tracking capabilities to the marketer_actions table
-- and creates the task_phase_history table for tracking task movement through phases.

-- ============================================================
-- 1. Add phase tracking columns to marketer_actions table
-- ============================================================

-- Add phase_id to link tasks to execution phases
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES execution_phases(id) ON DELETE SET NULL;

-- Add estimated_hours for time estimation
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;

-- Add started_at to track when task entered current phase
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add completed_at to track when task was completed
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add time_in_phase_minutes to track cumulative time in current phase
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS time_in_phase_minutes INTEGER DEFAULT 0;

-- ============================================================
-- 2. Create task_phase_history table
-- ============================================================

CREATE TABLE IF NOT EXISTS task_phase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES marketer_actions(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES execution_phases(id) ON DELETE CASCADE,
    phase_name TEXT NOT NULL,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_at TIMESTAMPTZ,
    time_spent_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Add indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_marketer_actions_phase_id 
ON marketer_actions(phase_id);

CREATE INDEX IF NOT EXISTS idx_marketer_actions_started_at 
ON marketer_actions(started_at);

CREATE INDEX IF NOT EXISTS idx_task_phase_history_action_id 
ON task_phase_history(action_id);

CREATE INDEX IF NOT EXISTS idx_task_phase_history_phase_id 
ON task_phase_history(phase_id);

CREATE INDEX IF NOT EXISTS idx_task_phase_history_entered_at 
ON task_phase_history(entered_at);

-- ============================================================
-- 4. Create helper functions
-- ============================================================

-- Function to calculate time spent in phase when exiting
CREATE OR REPLACE FUNCTION calculate_time_spent_minutes(
    p_entered_at TIMESTAMPTZ,
    p_exited_at TIMESTAMPTZ
) RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(EPOCH FROM (p_exited_at - p_entered_at)) / 60;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-update time_in_phase_minutes
CREATE OR REPLACE FUNCTION update_time_in_phase()
RETURNS TRIGGER AS $$
BEGIN
    -- If started_at changed AND time_in_phase_minutes wasn't explicitly updated,
    -- reset time_in_phase_minutes to 0 (for simple phase moves).
    -- If time_in_phase_minutes WAS updated (different from old value), preserve it
    -- (for resume/carry-over scenarios).
    IF OLD.started_at IS DISTINCT FROM NEW.started_at AND 
       OLD.time_in_phase_minutes = NEW.time_in_phase_minutes THEN
        NEW.time_in_phase_minutes := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_time_in_phase ON marketer_actions;
CREATE TRIGGER trigger_update_time_in_phase
    BEFORE UPDATE ON marketer_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_time_in_phase();

-- ============================================================
-- 5. Function to calculate phase drift from task data
-- ============================================================

-- Drop existing function if it has different signature
DROP FUNCTION IF EXISTS calculate_phase_drift(UUID);

CREATE OR REPLACE FUNCTION calculate_phase_drift(p_phase_id UUID)
RETURNS TABLE (
    total_time_minutes INTEGER,
    planned_minutes INTEGER,
    drift_minutes INTEGER,
    drift_type TEXT
) AS $$
DECLARE
    v_planned_days NUMERIC;
    v_total_minutes INTEGER;
    v_planned_minutes INTEGER;
    v_drift INTEGER;
BEGIN
    -- Get planned duration for this phase
    SELECT planned_duration_days INTO v_planned_days
    FROM execution_phases
    WHERE id = p_phase_id;
    
    -- Convert planned days to minutes (8 hour workdays)
    v_planned_minutes := COALESCE(v_planned_days * 8 * 60, 0);
    
    -- Sum time spent by all tasks in this phase
    SELECT COALESCE(SUM(
        CASE 
            WHEN exited_at IS NOT NULL THEN time_spent_minutes
            ELSE EXTRACT(EPOCH FROM (NOW() - entered_at)) / 60
        END
    ), 0)::INTEGER INTO v_total_minutes
    FROM task_phase_history
    WHERE phase_id = p_phase_id;
    
    -- Calculate drift
    v_drift := v_total_minutes - v_planned_minutes;
    
    RETURN QUERY SELECT 
        v_total_minutes,
        v_planned_minutes,
        v_drift,
        CASE 
            WHEN v_drift > 0 THEN 'negative'
            WHEN v_drift < 0 THEN 'positive'
            ELSE 'neutral'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROLLBACK (uncomment to revert)
-- ============================================================
-- DROP TRIGGER IF EXISTS trigger_update_time_in_phase ON marketer_actions;
-- DROP FUNCTION IF EXISTS update_time_in_phase();
-- DROP FUNCTION IF EXISTS calculate_time_spent_minutes(TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS calculate_phase_drift(UUID);
-- DROP TABLE IF EXISTS task_phase_history;
-- DROP INDEX IF EXISTS idx_marketer_actions_started_at;
-- DROP INDEX IF EXISTS idx_marketer_actions_phase_id;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS time_in_phase_minutes;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS completed_at;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS started_at;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS estimated_hours;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS phase_id;
