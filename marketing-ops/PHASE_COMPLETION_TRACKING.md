# Phase Completion Tracking for Ad Deliverables

## Overview
This update adds the ability to track which phases have been completed for each ad deliverable action card. When a card is moved to a new phase, the previous phase is automatically marked as completed by adding its ID to the `completed_phases` array.

## Changes Made

### 1. Database Schema
**File:** `scripts/add-completed-phases.sql`
- Added `completed_phases` column to `marketer_actions` table
- Type: `UUID[]` (array of phase IDs)
- Default: Empty array
- Indexed using GIN for efficient array queries

### 2. Server-Side Logic
**File:** `server/routes/campaignExecution.ts`
- Updated the `/api/campaigns/:campaignId/tasks/:taskId/move` endpoint
- When moving a task to a new phase:
  - Retrieves the current `completed_phases` array
  - Adds the old phase ID to the array (if not already present)
  - Updates the task with the new `completed_phases` array
- Added `completed_phases` to allowed columns in create and update endpoints

### 3. TypeScript Types
**File:** `src/types/actions.ts`
- Added `completed_phases?: string[]` to the `MarketerAction` interface
- Allows tracking of completed phases throughout the application

## How It Works

1. **When a card is created**: `completed_phases` starts as an empty array
2. **When a card moves between phases**:
   - The current phase ID is added to `completed_phases` before moving
   - The card is updated with the new phase ID
   - Time tracking history is recorded
3. **Result**: The action card maintains a historical record of all phases it has completed

## Example Flow

```typescript
// Card starts in Planning phase
{
  phase_id: 'planning-phase-uuid',
  completed_phases: []
}

// Card moves to Creative phase
{
  phase_id: 'creative-phase-uuid',
  completed_phases: ['planning-phase-uuid']
}

// Card moves to Launch phase
{
  phase_id: 'launch-phase-uuid',
  completed_phases: ['planning-phase-uuid', 'creative-phase-uuid']
}
```

## Database Migration

To apply this change to your database, run the SQL migration:

### Option 1: Using Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/add-completed-phases.sql`
4. Click "Run" to execute the migration

### Option 2: Using psql (if you have it installed)
```bash
psql "$DATABASE_URL" -f scripts/add-completed-phases.sql
```

### Option 3: Using the run-database-setup.sh script
The migration is standalone and can be run independently:
```bash
cat scripts/add-completed-phases.sql | psql "$DATABASE_URL"
```

## Testing

After applying the migration:
1. Start the application: `npm run dev`
2. Create or open a campaign with ad deliverables
3. Drag an ad card from one phase to another
4. The card should track the previous phase as completed
5. You can verify by checking the `completed_phases` field in the database

## Future Enhancements

Potential uses of the `completed_phases` tracking:
- Show a visual indicator of which phases have been completed
- Calculate phase completion metrics (% of tasks that completed each phase)
- Identify bottlenecks (phases where tasks get stuck)
- Generate reports on phase throughput
- Allow filtering/searching by completed phases

## Notes

- The migration is idempotent - safe to run multiple times
- Existing tasks will have an empty `completed_phases` array by default
- The GIN index allows efficient querying of tasks by completed phases
- Phase IDs are stored, so you can still look up phase details by joining with `execution_phases` table
