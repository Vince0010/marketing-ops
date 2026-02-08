-- Add planned_timeline tracking to marketer_actions
-- This migration adds a JSONB field to store the planned time allocation per phase for each action card

-- Add planned_timeline column to marketer_actions table
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS planned_timeline JSONB;

-- Create an index for JSON queries
CREATE INDEX IF NOT EXISTS idx_marketer_actions_planned_timeline 
ON marketer_actions USING GIN (planned_timeline);

-- Add comment to explain the column
COMMENT ON COLUMN marketer_actions.planned_timeline IS 
'JSON map of phase IDs to planned duration (in minutes) for this action card. 
Structure: { "phase-id": { "phase_name": "Planning", "planned_minutes": 480, "phase_number": 1 } }
This is set when the action card is created and used to calculate drift per deliverable.';

-- Example of how planned_timeline would look:
-- {
--   "uuid-phase-1": { "phase_name": "Planning", "planned_minutes": 480, "phase_number": 1 },
--   "uuid-phase-2": { "phase_name": "Creative", "planned_minutes": 960, "phase_number": 2 },
--   "uuid-phase-3": { "phase_name": "Launch", "planned_minutes": 240, "phase_number": 3 }
-- }
