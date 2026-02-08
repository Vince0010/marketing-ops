# Automatic Drift Analysis Generation on Phase Transition

## Overview
This implementation automatically generates drift analysis events when action cards (ad deliverables) transition from one phase to the next. The system now enforces sequential phase transitions and creates drift records in the `drift_events` table.

## Key Features

### 1. Sequential Phase Enforcement
- Cards **cannot skip phases** when moving forward
- Cards must progress sequentially: Phase 1 → Phase 2 → Phase 3, etc.
- An alert is shown if the user attempts to skip a phase
- Backward movement is still allowed (with the existing resume/restart modal)

**Location**: `src/components/kanban/KanbanBoard.tsx`

```typescript
// Prevent skipping phases when moving forward
if (movingForward && oldPhaseId && newPhaseId) {
    const oldPhase = phases.find(p => p.id === oldPhaseId)
    const newPhase = phases.find(p => p.id === newPhaseId)
    
    if (oldPhase && newPhase) {
        const phaseDiff = newPhase.phase_number - oldPhase.phase_number
        if (phaseDiff > 1) {
            // User is trying to skip phases - show alert and cancel move
            alert(`Cannot skip phases. Please move the card sequentially...`)
            return
        }
    }
}
```

### 2. Automatic Drift Event Generation
When a card moves from one phase to the next, the system:
1. Calculates the actual time spent in the completed phase
2. Compares it against the planned time (from `planned_timeline`)
3. Generates a drift event in the `drift_events` table

**Location**: `server/routes/campaignExecution.ts`

#### Drift Calculation
- **Planned Time**: Retrieved from the card's `planned_timeline` JSON object
- **Actual Time**: Sum of time spent in the phase (from `task_phase_history`)
- **Drift**: `actualMinutes - plannedMinutes`
- **Drift Days**: Converted to 8-hour workdays for database storage

#### Drift Classification
- **Positive Drift** (ahead of schedule): More than 1 hour ahead
- **Negative Drift** (behind schedule): More than 1 hour behind  
- **Neutral**: Within ±1 hour of planned time

#### Drift Event Data
Each drift event includes:
```typescript
{
    campaign_id: string,
    phase_id: string,
    drift_days: number,          // Converted to 8-hour workdays
    drift_type: 'positive' | 'negative' | 'neutral',
    phase_name: string,
    planned_duration: number,     // Days
    actual_duration: number,      // Days
    root_cause: string,           // From delay_reason if negative drift
    reason: string,               // Human-readable explanation
    impact_description: string,   // Details about the card and time spent
    recorded_by: 'system',
    recorded_at: timestamp
}
```

## Workflow

### Normal Forward Flow (No Delay)
1. User drags card from Phase 1 to Phase 2
2. System validates: Phase 2 is exactly one phase ahead ✓
3. System closes Phase 1 history entry with time spent
4. **System generates drift event for Phase 1**
5. System creates Phase 2 history entry
6. System updates task status
7. Card appears in Phase 2 column

### Forward Flow with Time Budget Overrun
1. User drags card from Phase 1 to Phase 2
2. System detects: time spent > planned time
3. System shows delay modal requesting reason
4. User provides delay reason
5. System closes Phase 1 history entry with time spent
6. **System generates drift event (negative) with delay reason**
7. Card moves to Phase 2

### Backward Flow (Return to Previous Phase)
1. User drags card from Phase 3 back to Phase 2
2. System detects: backward move to completed phase
3. System shows "Resume or Restart" modal
4. User chooses resume or restart
5. **No new drift event generated** (phase was already completed previously)
6. Card returns to Phase 2

### Attempting to Skip Phases
1. User drags card from Phase 1 to Phase 3
2. System detects: phase_number difference > 1
3. **System shows alert and cancels the move**
4. Card remains in Phase 1

## Data Flow

```
Card exits Phase 1 and enters Phase 2
        ↓
Validate: Phase 2 = Phase 1 + 1? ✓
        ↓
Close Phase 1 history entry
Calculate actual time spent
        ↓
Get planned time from planned_timeline
        ↓
Calculate drift:
├─ driftMinutes = actual - planned
├─ driftDays = driftMinutes / 60 / 8
└─ driftType = positive | negative | neutral
        ↓
Generate drift_event record:
├─ campaign_id
├─ phase_id (Phase 1)
├─ drift_days
├─ drift_type
├─ phase_name
├─ planned/actual durations
├─ root_cause (if delayed)
└─ impact_description
        ↓
Insert into drift_events table
        ↓
Create Phase 2 history entry
Update task to Phase 2
        ↓
SSE broadcast to all clients
```

## Database Schema

The drift events are stored in the existing `drift_events` table:

```sql
CREATE TABLE drift_events (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  campaign_id UUID REFERENCES campaigns(id),
  phase_id UUID REFERENCES execution_phases(id),
  drift_days INTEGER,
  drift_type TEXT CHECK (drift_type IN ('positive', 'negative', 'neutral')),
  phase_name TEXT,
  planned_duration INTEGER,
  actual_duration NUMERIC,
  root_cause TEXT,
  reason TEXT,
  impact_description TEXT,
  recorded_by TEXT,
  recorded_at TIMESTAMPTZ,
  -- ... other fields
);
```

## Benefits

1. **Automatic Tracking**: No manual entry required for drift analysis
2. **Real-time Data**: Drift events created immediately when cards move
3. **Sequential Integrity**: Enforced phase order ensures accurate drift tracking
4. **Contextual Information**: Delay reasons captured when tasks run over budget
5. **Historical Record**: Complete audit trail of phase completions and drift
6. **AI Analysis Ready**: Drift events can be analyzed by AI recommendations engine
7. **Template Worthy**: Identifies patterns for creating campaign templates

## Usage

### For Users
1. Create a campaign with execution phases and planned durations
2. Add ad deliverables with planned timelines
3. Move cards through phases sequentially using the Kanban board
4. If a card takes longer than planned, provide a delay reason when prompted
5. View drift analysis in the Execution tab's "Ad Deliverable Drift" panel
6. Check the Drift Analysis tab to see all drift events for the campaign

### For Developers
- Drift events are automatically created by the server
- No additional frontend code needed
- Access drift data from `drift_events` table via Supabase
- Filter by `campaign_id` to get campaign-specific drift
- Filter by `phase_id` to get phase-specific drift
- Use `drift_type` to categorize positive/negative/neutral drift

## Files Modified

1. **server/routes/campaignExecution.ts**
   - Added drift event generation in `POST /campaigns/:campaignId/tasks/:taskId/move`
   - Captures completed phase data (ID, name, time spent)
   - Calculates drift based on planned vs actual time
   - Inserts drift event into database

2. **src/components/kanban/KanbanBoard.tsx**
   - Added phase skip validation in `handleDragEnd`
   - Prevents forward moves that skip phases (phase_number > 1 difference)
   - Shows user-friendly alert when skip is attempted

## Testing

To verify the implementation:

1. **Create a test campaign** with 3 phases (each 1 day planned)
2. **Add an ad deliverable** to the campaign
3. **Move it to Phase 1** and wait a few minutes
4. **Move it to Phase 2** (should succeed, drift event created)
5. **Query the database**:
   ```sql
   SELECT * FROM drift_events 
   WHERE campaign_id = '<your-campaign-id>' 
   ORDER BY created_at DESC;
   ```
6. **Try to skip Phase 2** by dragging directly to Phase 3
   - Should see an alert preventing the move
7. **View drift in the UI** on the Execution tab

## Future Enhancements

- Add drift threshold alerts (email/notification when drift exceeds X%)
- Create dashboard widget showing real-time drift summary
- Export drift analysis reports to CSV/PDF
- Use drift patterns to suggest timeline adjustments for new campaigns
- Integrate drift events into AI recommendations engine for proactive suggestions
