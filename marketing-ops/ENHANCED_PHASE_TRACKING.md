# Enhanced Phase Completion Tracking with Backward Movement

## Overview
This implementation provides sophisticated phase completion tracking with intelligent backward movement handling:

1. **Forward Movement (Planning → Development)**
   - Previous phase marked as completed
   - Time resets to 0 in new phase
   - Previous phase ID added to `completed_phases` array

2. **Backward Movement (Development → Planning)**
   - System detects you're returning to a previously completed phase
   - Shows confirmation dialog with two options:
     - **Resume**: Continue with previous time (38 hours persisted)
     - **Start Fresh**: Reset to 0 hours
   - Phase status changes back to "in_progress"

## User Experience Flow

### Scenario: Action Card Workflow

```
Planning (0h) → Start work
    ↓ (work for 38 hours)
Planning (38h) → Move to Development
    ↓
Development (0h, Planning marked COMPLETED)
    ↓ (discover issue, need to go back)
Development → Move back to Planning
    ↓
[CONFIRMATION DIALOG APPEARS]
    ↓
User Choice:
├─ Resume (38h) → Planning (38h continues)
└─ Start Fresh (0h) → Planning (0h starts over)
```

## Changes Made

### 1. Database Migration
**File:** `scripts/add-completed-phases.sql`
- Adds `completed_phases` UUID[] column to track completed phase IDs
- See: [Migration File](scripts/add-completed-phases.sql)

### 2. Server-Side Logic
**File:** `server/routes/campaignExecution.ts`
- Added `restartPhase` parameter to move endpoint
- When `restartPhase = false` (default): Carries over previous time
- When `restartPhase = true`: Starts from 0
- Marks old phase as completed in `completed_phases` array
- Lines updated: 163-290

### 3. Frontend Components

#### Backward Move Modal
**New File:** `src/components/kanban/BackwardMoveModal.tsx`
- Shows when returning to a completed phase
- Displays:
  - Task name
  - Phase name  
  - Previous time spent
  - Two action buttons: "Resume" or "Start Fresh"
- Beautiful UI with icons and clear descriptions

#### KanbanBoard Updates
**File:** `src/components/kanban/KanbanBoard.tsx`
- Detects backward vs forward movement
- Shows BackwardMoveModal for backward moves to completed phases
- Passes `restartPhase` parameter based on user choice
- Lines added: 83-100 (state), 195-214 (detection), 263-313 (handlers)

### 4. Hooks & Services

#### useCampaignExecution Hook
**File:** `src/hooks/useCampaignExecution.ts`
- Added `restartPhase` parameter to `moveTaskToPhase` function
- Conditionally calculates carry-over time based on `restartPhase` flag
- Lines updated: 18-23, 143-150, 159-162, 219-227

#### campaignExecutionService
**File:** `src/services/campaignExecutionService.ts`
- Added `restartPhase` parameter to service call
- Passes parameter to server endpoint
- Lines updated: 71-87

### 5. TypeScript Types
**File:** `src/types/actions.ts`
- Added `completed_phases?: string[]` to `MarketerAction` interface
- Line 29-30

## Technical Details

### Phase Completion Logic

```typescript
// Server-side (campaignExecution.ts)
if (oldPhaseId && currentTask) {
    const completedPhases = currentTask.completed_phases || []
    if (!completedPhases.includes(oldPhaseId)) {
        updates.completed_phases = [...completedPhases, oldPhaseId]
    }
}
```

### Time Carry-Over Logic

```typescript
// Server-side
let carryOverMinutes = 0
if (newPhaseId && !restartPhase) {
    // Sum up all previous time in this phase
    const prevHistory = await getTaskPhaseHistory(taskId, newPhaseId)
    carryOverMinutes = prevHistory.reduce(
        (sum, h) => sum + (h.time_spent_minutes || 0), 0
    )
}
```

### Backward Movement Detection

```typescript
// KanbanBoard.tsx
if (!movingForward && newPhaseId && task.completed_phases?.includes(newPhaseId)) {
    const totalPreviousMinutes = history
        .filter(h => h.action_id === taskId && h.phase_id === newPhaseId && h.exited_at)
        .reduce((sum, h) => sum + (h.time_spent_minutes || 0), 0)
    
    if (totalPreviousMinutes > 0) {
        // Show confirmation dialog
        setIsBackwardMoveModalOpen(true)
    }
}
```

## Database Migration Required

Run this SQL in your Supabase SQL Editor:

```sql
-- From scripts/add-completed-phases.sql
ALTER TABLE marketer_actions
ADD COLUMN IF NOT EXISTS completed_phases UUID[] DEFAULT ARRAY[]::UUID[];

CREATE INDEX IF NOT EXISTS idx_marketer_actions_completed_phases 
ON marketer_actions USING GIN (completed_phases);
```

## Testing Instructions

1. **Apply the database migration** (see above)

2. **Start the application:**
   ```bash
   npm run dev:all
   ```

3. **Test Forward Movement:**
   - Create an action card in the Backlog
   - Drag it to "Planning" phase
   - Wait or let time accumulate (e.g., 38 hours)
   - Drag to "Development" phase
   - ✓ Time should reset to 0 in Development
   - ✓ Planning should be in `completed_phases` array

4. **Test Backward Movement:**
   - Drag the card back to "Planning"
   - ✓ Modal should appear asking "Resume or Start Fresh?"
   - Click "Resume"
   - ✓ Time should show 38 hours continuing
   - OR click "Start Fresh"
   - ✓ Time should reset to 0

5. **Test Multiple Backward/Forward Cycles:**
   - Move Planning → Development → Launch
   - Move back Launch → Development
   - ✓ Should offer to resume previous Development time
   - Continue moving forward/backward
   - ✓ Each phase should remember its time independently

## Data Flow Diagram

```
User drags card backward
        ↓
KanbanBoard detects: !movingForward && completed_phases.includes(newPhaseId)
        ↓
Check task_phase_history for previous time
        ↓
Show BackwardMoveModal with previous time
        ↓
User chooses:
├─ Resume → restartPhase = false → carryOverMinutes = previousTime
└─ Restart → restartPhase = true → carryOverMinutes = 0
        ↓
Server updates:
├─ time_in_phase_minutes = carryOverMinutes
├─ started_at = now
├─ phase_id = newPhaseId
└─ status = 'in_progress'
        ↓
Server removes newPhaseId from completed_phases (phase is active again)
        ↓
Client receives updated task
        ↓
UI shows card in new phase with correct time
```

## Additional Features

### Potential UI Enhancements

1. **Phase Completion Badges**
   - Show checkmarks on completed phases
   - Visual progress indicator

2. **Time History Tooltip**
   - Hover over card to see time spent in each phase
   - Historical timeline visualization

3. **Phase Statistics**
   - Average time per phase
   - Cards stuck in phases
   - Completion rates

### Future Query Capabilities

```sql
-- Find all tasks that completed Planning phase
SELECT * FROM marketer_actions 
WHERE 'planning-phase-uuid' = ANY(completed_phases);

-- Find tasks that never completed a specific phase
SELECT * FROM marketer_actions 
WHERE NOT ('creative-phase-uuid' = ANY(completed_phases));

-- Phase completion rate
SELECT 
    phase_id,
    COUNT(*) FILTER (WHERE phase_id = ANY(completed_phases)) as completed_count,
    COUNT(*) as total_count
FROM marketer_actions
GROUP BY phase_id;
```

## Summary

The system now provides intelligent phase completion tracking with:
- ✅ Automatic phase completion marking when moving forward
- ✅ Time reset to 0 in new phases  
- ✅ Confirmation dialog when moving backward
- ✅ Option to resume or restart when returning to completed phases
- ✅ Complete time history preservation
- ✅ Phase status management (in_progress ↔ completed)
- ✅ Array-based tracking for flexible queries

All changes are backward compatible with existing data!
