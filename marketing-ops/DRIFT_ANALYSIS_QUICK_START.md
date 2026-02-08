# Quick Start: Action Card Drift Analysis

## Step 1: Run Database Migration

### Option A: Supabase SQL Editor (Recommended)
1. Go to: https://supabase.com/dashboard/project/xktszgxqtkcpewmhxbhj/editor
2. Create a new query
3. Copy and paste the contents of `scripts/add-planned-timeline.sql`
4. Click "Run" or press Cmd+Enter

### Option B: Using Node Script
```bash
cd /Users/kmmperez/projects/marketing-ops-tracking-system/marketing-ops/marketing-ops
node scripts/run-planned-timeline-migration.mjs
```

## Step 2: Test the Feature

### Create a New Campaign
1. Navigate to Campaign Create page
2. Fill in campaign details
3. Define execution stages (e.g., Planning, Creative, Compliance, Launch)
4. Add ad deliverables (e.g., "Facebook Video Ad", "Instagram Story")
5. Submit the campaign

### View Drift Analysis
1. Go to the Campaign Tracker for your new campaign
2. Click on the "Execution" tab
3. You'll see two sections:
   - **Ad Deliverables Board**: Kanban board for moving cards
   - **Ad Deliverable Drift Analysis**: New drift tracking panel

### Move Cards Through Stages
1. Drag an ad deliverable card from backlog to first phase (e.g., "Planning")
2. Wait a few minutes or hours (time will accumulate)
3. Drag to next phase (e.g., "Creative")
4. Observe drift metrics update in the Drift Analysis panel

## What You'll See

### Summary Stats
- Total Ads count
- Number ahead of schedule
- Number on track
- Number behind schedule

### Per-Deliverable Cards
Each card shows:
- Ad title with platform/type badges
- Status badge (Ahead/On Track/Behind)
- Time summary: Planned vs Actual vs Drift
- Progress bar showing phases completed
- Current phase indicator
- Expandable phase-by-phase breakdown

## Testing Scenarios

### Scenario 1: Card On Track
1. Create campaign with Planning phase (1 day = 480 minutes)
2. Move card to Planning
3. Wait ~8 hours or less
4. Move to next phase
5. Result: Should show "On Track" status

### Scenario 2: Card Behind Schedule
1. Create campaign with Creative phase (2 days = 960 minutes)
2. Move card to Creative
3. Let it sit for 3+ days
4. Move to next phase
5. Result: Should show "Behind" status with red indicator

### Scenario 3: Card Ahead of Schedule
1. Create campaign with Review phase (4 hours = 240 minutes)
2. Move card to Review
3. Move to next phase after just 2 hours
4. Result: Should show "Ahead" status with green indicator

## Verification Checklist

- [ ] Migration ran successfully (no errors)
- [ ] New campaigns can be created with ad deliverables
- [ ] Action cards have `planned_timeline` field populated
- [ ] Drift Analysis panel appears on Execution tab
- [ ] Summary stats calculate correctly
- [ ] Individual cards show drift metrics
- [ ] Phase breakdown expands and shows per-phase drift
- [ ] Status colors are correct (green=ahead, gray=on track, red=behind)
- [ ] Live time updates as card sits in a phase

## Troubleshooting

### Migration Errors
- Check Supabase logs for detailed error messages
- Ensure you have proper permissions
- Verify the marketer_actions table exists

### No Drift Data Showing
- Ensure campaign was created AFTER migration
- Check that action cards have `planned_timeline` field
- Verify task_phase_history entries are being created

### Incorrect Drift Calculations
- Check browser console for calculation errors
- Verify planned_timeline has correct structure
- Ensure task_phase_history has time_spent_minutes populated

## Files Modified

1. **Database**:
   - `scripts/add-planned-timeline.sql` - Migration script

2. **Types**:
   - `src/types/actions.ts` - New drift types

3. **Utils**:
   - `src/utils/actionCardDrift.ts` - Drift calculation logic

4. **Components**:
   - `src/components/kanban/ActionCardDriftPanel.tsx` - Drift display

5. **Pages**:
   - `src/pages/CampaignCreate.tsx` - Store planned timeline
   - `src/pages/CampaignTracker.tsx` - Display drift analysis

## Next Steps

After verifying the feature works:
1. Consider adding drift analysis to the main Drift Analysis tab
2. Add export functionality for drift reports
3. Create alerts for deliverables falling behind
4. Integrate with AI recommendations engine
5. Add bulk operations for updating multiple deliverables
