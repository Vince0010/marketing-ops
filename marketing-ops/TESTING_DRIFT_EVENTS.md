# Testing Drift Event Generation

## Quick Test Guide

### Step 1: Open the application
Navigate to: http://localhost:5175/

### Step 2: Navigate to a campaign
1. Go to the Dashboard
2. Click on any campaign (or create a new one)
3. Go to the "Execution" tab

### Step 3: Move a card between phases
1. Find an action card (ad deliverable) in the Kanban board
2. Drag it from its current phase to the next phase
   - **Important**: You can only move to the immediate next phase (no skipping)
   - Example: Phase 1 → Phase 2 (allowed)
   - Example: Phase 1 → Phase 3 (blocked with alert)

### Step 4: Check if drift event was created
no
#### Option A: Check in the UI
1. Go to the "Drift Analysis" tab
2. Scroll down to the "Action Card Drift Events" section
3. You should see the drift event that was just created

#### Option B: Check in the database
Open Supabase SQL Editor: https://supabase.com/dashboard/project/xktszgxqtkcpewmhxbhj/editor

Run this query:
```sql
SELECT 
    id,
    phase_name,
    drift_days,
    drift_type,
    planned_duration,
    actual_duration,
    reason,
    impact_description,
    created_at
FROM drift_events
WHERE campaign_id = '<your-campaign-id>'
ORDER BY created_at DESC
LIMIT 10;
```

#### Option C: Check the browser console
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Look for messages like:
   - `[API] Created drift event for phase: <phase name>`
   - `[CampaignTracker] Loaded drift events from database: X`

### Step 5: Verify the drift calculation

The drift event should include:
- **phase_name**: Name of the phase that was completed
- **drift_days**: Positive (behind) or negative (ahead) number
- **drift_type**: 'positive', 'negative', or 'neutral'
- **planned_duration**: Expected days for the phase
- **actual_duration**: Actual days spent
- **reason**: Human-readable explanation
- **impact_description**: Details about the card and time spent
- **root_cause**: Delay reason (if card was over budget)

### Example Drift Event

```json
{
  "id": "...",
  "campaign_id": "...",
  "phase_id": "...",
  "phase_name": "Creative Development",
  "drift_days": 0.3,
  "drift_type": "neutral",
  "planned_duration": 2,
  "actual_duration": 2.3,
  "reason": "Action card completed on schedule",
  "impact_description": "Action card \"Facebook Image Ad\" spent 18.5h in Creative Development phase (planned: 16h)",
  "root_cause": null,
  "created_at": "2026-02-09T..."
}
```

## Troubleshooting

### Drift events not appearing in UI?
1. Check browser console for errors
2. Verify the campaign ID is correct
3. Refresh the page after moving a card
4. Check if `dbDriftEvents` is populated in React DevTools

### Drift events not in database?
1. Check server console for error messages
2. Verify the card has `planned_timeline` set
3. Check that the card actually moved from one phase to another
4. Verify Supabase connection is working

### Can't move card to next phase?
1. Make sure you're moving to the immediate next phase (no skipping)
2. Check if there's a time budget overrun (you may need to provide a delay reason)
3. Verify the phases have sequential `phase_number` values

## Expected Behavior

✅ Moving Phase 1 → Phase 2: Should create drift event for Phase 1  
✅ Moving Phase 2 → Phase 3: Should create drift event for Phase 2  
✅ Moving backward: Should show resume/restart modal (no new drift event)  
❌ Moving Phase 1 → Phase 3: Should show alert and prevent move  
✅ Drift events visible in "Drift Analysis" tab under "Action Card Drift Events"  
✅ Drift events stored in `drift_events` table with all fields populated
