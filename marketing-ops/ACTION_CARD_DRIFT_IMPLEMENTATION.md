# Action Card Drift Analysis Implementation

## Overview
This implementation tracks drift (planned vs actual time) for each ad deliverable action card as it moves through campaign execution stages.

## Architecture

### 1. Data Structure

#### Planned Timeline Map
Each action card stores a `planned_timeline` JSON object that maps phase IDs to planned durations:

```typescript
{
  "phase-uuid-1": {
    "phase_name": "Planning",
    "planned_minutes": 480,  // 8 hours
    "phase_number": 1
  },
  "phase-uuid-2": {
    "phase_name": "Creative",
    "planned_minutes": 960,  // 2 days (16 hours)
    "phase_number": 2
  },
  // ... more phases
}
```

This map is created when the action card is first added to the campaign and uses the phase planned durations (8-hour workdays).

#### Actual Time Tracking
Actual time is tracked via the existing `task_phase_history` table:
- When a card enters a phase: entry created with `entered_at` timestamp
- When a card exits a phase: entry updated with `exited_at` timestamp and `time_spent_minutes`
- Multiple entries can exist for the same phase if card returns to it

### 2. Database Changes

**New Column**: `marketer_actions.planned_timeline` (JSONB)
- Migration script: `scripts/add-planned-timeline.sql`
- Indexed with GIN for efficient JSON queries

### 3. Type Definitions

**New Types** (`src/types/actions.ts`):
- `ActionCardPlannedTimeline`: Map of phase IDs to planned info
- `ActionCardPhaseDrift`: Drift metrics for a single phase
- `ActionCardDriftAnalysis`: Complete drift analysis for an action card

### 4. Calculation Logic

**Utility Functions** (`src/utils/actionCardDrift.ts`):
- `calculateActionCardDrift()`: Calculates drift for a single action card
  - Compares planned vs actual time per phase
  - Aggregates total drift across all phases
  - Returns status: 'ahead', 'on_track', or 'behind'
  
- `calculateCampaignActionCardDrifts()`: Calculates drift for all action cards

**Drift Calculation Per Phase**:
1. Get planned minutes from `planned_timeline`
2. Sum all `time_spent_minutes` from `task_phase_history` for that phase
3. If card is currently in the phase, add live elapsed time
4. Calculate drift: `actual - planned`
5. Calculate percentage: `(drift / planned) * 100`
6. Determine status:
   - Ahead: < -10%
   - Behind: > +10%
   - On Track: -10% to +10%

### 5. Campaign Creation Flow

**Updated** (`src/pages/CampaignCreate.tsx`):
1. User defines execution phases with durations
2. Phases are created in database
3. For each ad deliverable:
   - Build `planned_timeline` map from created phases
   - Create action card with `planned_timeline` included
   - Card starts in backlog (no phase assigned)

### 6. Execution Tab Display

**Updated** (`src/pages/CampaignTracker.tsx`):
- Calculates drift analyses using `calculateCampaignActionCardDrifts()`
- Displays results in `ActionCardDriftPanel` component
- Updates automatically as cards move between phases

**Component** (`src/components/kanban/ActionCardDriftPanel.tsx`):
- Shows summary stats (total ads, ahead/on-track/behind counts)
- Lists each action card with:
  - Platform and post type badges
  - Overall drift status
  - Total planned vs actual time
  - Progress through phases
  - Expandable phase-by-phase breakdown

### 7. Real-time Updates

The drift analysis updates automatically when:
- A card moves to a new phase (creates history entry)
- Time passes while a card is in a phase (live calculation)
- The execution tab is viewed (recalculates from latest data)

## Usage Flow

1. **Campaign Creation**:
   - Define phases with durations
   - Add ad deliverables
   - System stores planned timeline for each deliverable

2. **Execution**:
   - Move cards through phases using Kanban board
   - System tracks actual time spent in each phase
   - Drift is calculated in real-time

3. **Analysis**:
   - View drift analysis on Execution tab
   - See which deliverables are ahead/behind schedule
   - Drill down to see which phases caused drift
   - Use insights to adjust resources or timelines

## Key Features

✅ **Per-Deliverable Tracking**: Each ad deliverable has its own drift metrics  
✅ **Stage-by-Stage Breakdown**: See drift for each execution phase  
✅ **Real-time Calculation**: Updates as cards move through workflow  
✅ **Historical Accuracy**: Handles cards that return to previous phases  
✅ **Visual Status Indicators**: Color-coded badges show ahead/on-track/behind  
✅ **Expandable Details**: Click to see phase-by-phase time breakdown  

## Migration Instructions

1. Run the database migration:
   ```bash
   # Option 1: Using Supabase SQL Editor
   # Copy contents of scripts/add-planned-timeline.sql
   # Paste and run in: https://supabase.com/dashboard/project/xktszgxqtkcpewmhxbhj/editor
   
   # Option 2: Using the migration script
   node scripts/run-planned-timeline-migration.mjs
   ```

2. Existing action cards won't have drift analysis until:
   - New campaigns are created (will have planned_timeline from start)
   - Or manually update existing cards with planned timeline

## Example Drift Analysis Output

```
Facebook Image Ad - Product Launch
Platform: facebook · image
Status: Behind (+23%)

Planned: 24h | Actual: 29h 30m | Drift: +5h 30m

Progress: 3 / 5 phases complete
Current: Compliance Review

Phase Breakdown:
  Planning:    4h → 3h 45m    -15m  (ahead)
  Creative:    8h → 12h       +4h   (behind)
  Review:      4h → 6h 30m    +2h 30m (behind)
  Compliance:  [in progress]
  Launch:      [pending]
```

## Benefits

1. **Accountability**: See exactly which deliverables are taking longer than planned
2. **Early Warning**: Identify delays before they impact campaign launch
3. **Resource Planning**: Understand where to allocate more resources
4. **Process Improvement**: Identify consistently problematic phases
5. **Client Communication**: Data-driven updates on deliverable status
