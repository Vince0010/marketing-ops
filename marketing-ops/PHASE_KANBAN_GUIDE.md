# Phase-Based Task Kanban - Implementation Guide

## Overview

The execution timeline has been transformed into a **phase-based task kanban board** where:
- **Execution phases** (Planning, Creative, Compliance, etc.) are displayed as **kanban columns**
- **Individual tasks** are represented as **draggable cards** that move through workflow phases
- **Time tracking** automatically records how long each task spends in each phase
- **Drift analysis** aggregates task times to calculate whether phases are ahead or behind schedule

## What Changed

### Database Schema
- Added phase tracking and time tracking fields to `marketer_actions` table
- Created `task_phase_history` table to track task movement through phases
- Added helper functions for calculating phase-level drift from task data

### UI Components
- **KanbanBoard**: Now uses dynamic phase columns instead of fixed status columns
- **ActionCardEditor**: Includes phase selection dropdown and time estimation field
- **ActionCard**: Displays time in phase and estimate vs actual indicators
- **KanbanColumn**: Shows aggregated phase metrics (total time, drift)

### Time Tracking
- Automatically starts tracking when a task is created or moved to a phase
- Records entry/exit timestamps in `task_phase_history`
- Calculates time spent in each phase in minutes
- Updates drift indicators in real-time

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration to add new columns and tables:

```bash
# Using Supabase CLI (if available)
supabase db push scripts/migrate-phase-tracking.sql

# Or using psql
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f scripts/migrate-phase-tracking.sql

# Or copy and paste the SQL into Supabase SQL Editor
```

**Migration file location**: `scripts/migrate-phase-tracking.sql`

**What it does**:
- Adds `phase_id`, `estimated_time_hours`, `started_at`, `completed_at`, `time_in_phase_minutes` to `marketer_actions`
- Creates `task_phase_history` table
- Adds indexes for performance
- Creates helper functions for drift calculation

### 2. Verify Migration

Check that the new columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'marketer_actions' 
AND column_name IN ('phase_id', 'estimated_time_hours', 'started_at', 'completed_at', 'time_in_phase_minutes');
```

Check that the history table exists:

```sql
SELECT * FROM task_phase_history LIMIT 1;
```

### 3. Seed Demo Data (Optional)

Populate the kanban board with sample phase-based tasks:

```bash
# Install dependencies if needed
npm install

# Run the seed script
npm run seed:phase-tasks

# Or use tsx directly
npx tsx scripts/seed-phase-tasks.ts
```

**Seed file location**: `scripts/seed-phase-tasks.ts`

**What it does**:
- Fetches existing campaigns and their execution phases
- Creates 20-30 sample tasks across all phases
- Simulates realistic time tracking data
- Generates phase history entries

### 4. Start Development Server

```bash
npm run dev
```

### 5. View the Kanban Board

Navigate to: `/campaigns/<campaign-id>/kanban`

## How to Use

### Creating Tasks

1. Click **"New Action"** button
2. Fill in task details:
   - **Title**: Brief task name
   - **Description**: Additional context
   - **Action Type**: Category (creative, budget, targeting, etc.)
   - **Workflow Phase**: Select which phase this task belongs to (required)
   - **Estimated Time**: How many hours you expect this to take (required)
3. Click **"Create Action"**

The task will appear in the selected phase column with time tracking automatically started.

### Moving Tasks Between Phases

1. **Drag** a task card
2. **Drop** it into a different phase column
3. Time tracking automatically:
   - Closes the previous phase history entry
   - Records time spent in the previous phase
   - Starts timing in the new phase
   - Updates the task's `started_at` timestamp

### Viewing Time Metrics

**On Task Cards**:
- Time in current phase (e.g., "2.5h in phase")
- Estimated time (e.g., "Est: 4h")
- Color-coded: 🟢 under estimate, 🔴 over estimate

**On Phase Columns**:
- Total time: Sum of all task times in that phase
- Planned duration: Expected phase duration from campaign setup
- Drift indicator: Shows if phase is ahead (-) or behind (+) schedule

### Understanding Drift

**Task-Level Drift**:
- Comparing actual time vs estimated time per task
- Shown on individual task cards

**Phase-Level Drift**:
- Aggregated from all tasks in that phase
- Shown in phase column headers
- Formula: `(Total Task Time) - (Planned Phase Duration)`
- Green badge = ahead of schedule (negative drift)
- Red badge = behind schedule (positive drift)

## Architecture

### Data Flow

```
User creates task
    ↓
Task assigned to phase, started_at = now
    ↓
Entry created in task_phase_history
    ↓
User drags task to new phase
    ↓
Calculate time in previous phase
    ↓
Update previous history entry with exited_at and time_spent_minutes
    ↓
Create new history entry for new phase
    ↓
Reset started_at for new phase
    ↓
Aggregated metrics displayed in column headers
```

### Key Tables

**marketer_actions** (tasks):
```sql
id, campaign_id, title, description, action_type, status,
phase_id,                    -- FK to execution_phases
estimated_time_hours,         -- User estimate
started_at,                   -- When entered current phase
completed_at,                 -- When task finished
time_in_phase_minutes         -- Running total in current phase
```

**task_phase_history** (time tracking):
```sql
id, action_id, phase_id, phase_name,
entered_at,                  -- When task entered this phase
exited_at,                   -- When task left this phase (null if still in phase)
time_spent_minutes           -- Calculated: exited_at - entered_at
```

**execution_phases** (columns):
```sql
id, campaign_id, phase_name, phase_number, phase_type,
planned_duration_days,       -- Expected duration
actual_duration_days,        -- Calculated from task data
drift_days                   -- actual - planned
```

### TypeScript Types

Updated types in `src/types/actions.ts`:
- `MarketerAction`: Added `phase_id`, `estimated_time_hours`, `started_at`, `completed_at`, `time_in_phase_minutes`
- `TaskPhaseHistory`: New interface for phase history records
- `createPhaseColumns()`: Helper to generate kanban columns from phases
- `getPhaseColor()`: Maps phase types to colors

## Troubleshooting

### Tasks Not Showing Time

**Problem**: Task cards don't display time metrics  
**Solution**: Ensure `started_at` is set when task is created/moved

```sql
UPDATE marketer_actions 
SET started_at = NOW() 
WHERE started_at IS NULL AND phase_id IS NOT NULL;
```

### Phase Columns Not Appearing

**Problem**: Kanban board says "No execution phases defined"  
**Solution**: Create execution phases during campaign setup or add them manually:

```sql
INSERT INTO execution_phases (campaign_id, phase_number, phase_name, phase_type, planned_duration_days, planned_start_date, planned_end_date, status)
VALUES 
  ('<campaign-id>', 1, 'Planning', 'planning', 3, '2026-02-01', '2026-02-04', 'pending'),
  ('<campaign-id>', 2, 'Creative', 'creative', 5, '2026-02-04', '2026-02-09', 'pending'),
  -- etc.
```

### Time Not Calculating Correctly

**Problem**: `time_in_phase_minutes` not updating  
**Solution**: The trigger auto-calculates on UPDATE. Manually recalculate:

```sql
UPDATE marketer_actions
SET time_in_phase_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
WHERE started_at IS NOT NULL;
```

### History Not Recording

**Problem**: No entries in `task_phase_history`  
**Solution**: Ensure drag-and-drop logic is working. Check browser console for errors. Manually insert if needed:

```sql
INSERT INTO task_phase_history (action_id, phase_id, phase_name, entered_at)
SELECT id, phase_id, 
       (SELECT phase_name FROM execution_phases WHERE id = marketer_actions.phase_id),
       started_at
FROM marketer_actions
WHERE phase_id IS NOT NULL 
  AND id NOT IN (SELECT action_id FROM task_phase_history WHERE exited_at IS NULL);
```

## Migration Rollback

If you need to revert the changes:

```sql
-- Rollback commands are at the bottom of migrate-phase-tracking.sql
-- Uncomment and run them

DROP TRIGGER IF EXISTS trigger_update_time_in_phase ON marketer_actions;
DROP FUNCTION IF EXISTS update_time_in_phase();
DROP FUNCTION IF EXISTS calculate_phase_drift(UUID);
DROP TABLE IF EXISTS task_phase_history;
DROP INDEX IF EXISTS idx_marketer_actions_started_at;
DROP INDEX IF EXISTS idx_marketer_actions_phase_id;
ALTER TABLE marketer_actions DROP COLUMN IF EXISTS time_in_phase_minutes;
ALTER TABLE marketer_actions DROP COLUMN IF EXISTS completed_at;
ALTER TABLE marketer_actions DROP COLUMN IF EXISTS started_at;
ALTER TABLE marketer_actions DROP COLUMN IF EXISTS estimated_time_hours;
ALTER TABLE marketer_actions DROP COLUMN IF EXISTS phase_id;
```

## Future Enhancements

Potential improvements for the future:

1. **Manual Time Entry**: Allow users to manually adjust time spent
2. **Time Tracking Pause/Resume**: Pause timer when task is blocked
3. **Task Dependencies**: Show dependencies between tasks
4. **Automated Drift Alerts**: Notify when phase is significantly over time
5. **Historical Analysis**: Compare drift across campaigns
6. **Team Workload View**: Visualize time allocation per team member
7. **Export Reports**: Generate PDF reports of phase performance

## Questions?

For issues or questions about this implementation:
1. Check browser console for errors
2. Verify database migration completed successfully
3. Ensure execution phases exist for the campaign
4. Review the TypeScript types match your database schema

---

**Last Updated**: February 8, 2026  
**Version**: 1.0.0
