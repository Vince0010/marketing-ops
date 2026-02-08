-- Add completed_phases tracking to marketer_actions
-- This migration adds a field to track which phases have been completed for each action card
-- When a card moves to a new phase, the old phase ID is added to this array

-- Add completed_phases column to marketer_actions table
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS completed_phases UUID[] DEFAULT ARRAY[]::UUID[];

-- Add index for performance when querying by completed phases
CREATE INDEX IF NOT EXISTS idx_marketer_actions_completed_phases 
ON marketer_actions USING GIN (completed_phases);

-- Add comment to document the column
COMMENT ON COLUMN marketer_actions.completed_phases IS 
'Array of phase IDs that have been completed for this action card. Updthis isated when the card moves to a new phase.';
