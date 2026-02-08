-- Add Overdue Tracking Fields Migration
-- This migration adds delay_reason and completion_timing for overdue task tracking

-- ============================================================
-- 1. Add delay_reason column to marketer_actions table
-- ============================================================

-- Add delay_reason to store reason for task delays
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS delay_reason TEXT;

-- Add due_date if not exists (for task-level deadlines)
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add priority column if not exists
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add assignee column if not exists
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS assignee TEXT;

-- ============================================================
-- 2. Add completion_timing to task_phase_history
-- ============================================================

-- Add completion_timing enum column to track if task was early/on_time/late
ALTER TABLE task_phase_history
ADD COLUMN IF NOT EXISTS completion_timing TEXT 
CHECK (completion_timing IN ('early', 'on_time', 'late'));

-- ============================================================
-- 3. Add index for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_marketer_actions_due_date 
ON marketer_actions(due_date);

-- ============================================================
-- ROLLBACK (uncomment to revert)
-- ============================================================
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS delay_reason;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS due_date;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS priority;
-- ALTER TABLE marketer_actions DROP COLUMN IF EXISTS assignee;
-- ALTER TABLE task_phase_history DROP COLUMN IF EXISTS completion_timing;
-- DROP INDEX IF EXISTS idx_marketer_actions_due_date;
