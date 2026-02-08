# Drift Analysis Visualization - Complete Guide

## Overview
When an ad deliverable (action card) transitions from one phase to the next, the system automatically:
1. ✅ Calculates drift (actual time vs planned time) for the completed phase
2. ✅ Saves the drift event to the database
3. ✅ Displays visual drift analysis with graphs and progress bars

## Visual Features

### 1. On the Kanban Card
Each action card now shows:
- **Completed Phases Badge** (green badge)
  - Shows: "X phases completed"
  - Appears automatically after completing any phase
  - Helps track progress at a glance

### 2. Ad Deliverable Drift Panel (Execution Tab)
Navigate to: **Execution Tab** → Scroll to "**Ad Deliverable Drift Analysis**" section

#### What You'll See:

**Summary Stats** (at the top):
- Total Ads
- Ahead (green) - deliverables finishing faster than planned
- On Track - deliverables on schedule
- Behind (red) - deliverables taking longer than planned

**For Each Ad Deliverable:**

1. **Header**
   - Platform icon (Facebook, Instagram, etc.)
   - Ad title
   - Platform · Post Type badge
   - Overall status badge (Ahead/On Track/Behind)

2. **Overall Time Summary** (3-column grid)
   - **Planned**: Total planned time across all phases
   - **Actual**: Total actual time spent
   - **Drift**: Difference with percentage (+X% or -X%)

3. **Progress Indicator**
   - Progress bar showing phases completed
   - "X / Y phases" label

4. **Phase-by-Phase Breakdown** (NEW! ⭐)
   For EACH phase the ad has gone through:
   
   ```
   Phase Name                               +2h 30m
   
   Planned: 8h     ████████░░░░░░░░
   Actual: 10h 30m ███████████████░
   ```
   
   **Visual Elements:**
   - Phase name on the left
   - Drift badge on the right (color-coded)
   - Two progress bars side-by-side:
     - **Blue bar** = Planned time
     - **Colored bar** = Actual time
       - 🟢 Green = Ahead (finished early)
       - 🔴 Red = Behind (took longer)
       - ⚪ Gray = On track
   - Exact time labels above each bar

### 3. Drift Analysis Tab
Navigate to: **Drift Analysis Tab** → Scroll to "**Action Card Drift Events**"

Shows a list of drift events from the database:
- Phase name
- Drift amount (+/- days)
- Planned vs actual duration
- Reason for drift (if delayed)
- Impact description
- When it was recorded

## Example Scenario

**Scenario**: Facebook Poster Ad moves from "Planning" to "Creative Development"

### What Happens:
1. **Planning phase completes**
   - Planned time: 32 hours (4 days × 8 hours)
   - Actual time: 5 hours 1 minute
   - Drift: -26 hours 59 minutes (AHEAD)

2. **Drift event created in database**
   ```json
   {
     "phase_name": "Planning",
     "drift_days": -3.4,
     "drift_type": "positive",
     "planned_duration": 4,
     "actual_duration": 0.6,
     "reason": "Action card completed 3.4 days ahead of planned timeline"
   }
   ```

3. **Visual Display**
   
   **On the card:**
   ```
   ✓ 1 phase completed
   ```
   
   **In Drift Panel:**
   ```
   Facebook Poster ads
   [facebook icon] Facebook · Image
   [Ahead badge]
   
   Planned: 32h | Actual: 5h | Drift: -27h (-84%)
   
   Progress: 1 / 4 phases ████░░░░░░░░
   
   Phase-by-Phase Breakdown:
   
   Planning                          -27h
   Planned: 32h    ████████████████
   Actual: 5h      ███░░░░░░░░░░░░░  (green bar)
   ```

## Color Coding Guide

### Drift Status Colors
- 🟢 **Green** = Ahead of schedule (finished faster than planned)
- ⚪ **Gray** = On track (within ±10% of planned time)
- 🔴 **Red** = Behind schedule (took longer than planned)

### Drift Thresholds
- **Ahead**: > 10% faster than planned
- **On Track**: ±10% of planned time
- **Behind**: > 10% slower than planned

## How to Test

1. **Open the app**: http://localhost:5175/
2. **Go to a campaign** → Execution tab
3. **Drag a card** from one phase to the next (e.g., Planning → Creative Development)
4. **Immediately check the "Ad Deliverable Drift Analysis" panel**
5. You should see:
   - Updated completion count
   - Visual progress bars for the completed phase
   - Drift badge showing time difference
   - Color-coded bar (green if ahead, red if behind)

## Benefits

✅ **Instant Visibility**: See drift immediately when a card moves
✅ **Visual Comparison**: Side-by-side bars make it easy to compare planned vs actual
✅ **Phase-Level Detail**: Understand which phases are problematic
✅ **Color Coding**: Quick identification of ahead/behind status
✅ **Historical Record**: All drift events saved in database for analysis
✅ **No Manual Entry**: Completely automatic tracking

## What's New in This Update

1. ✨ **Visual progress bars** for each phase (planned vs actual)
2. ✨ **Side-by-side comparison** instead of just numbers
3. ✨ **Always visible** (no longer hidden in expandable details)
4. ✨ **Color-coded bars** matching drift status
5. ✨ **Completed phases badge** on action cards
6. ✨ **Drift events stored in database** for historical analysis

## Next Steps

- View real-time drift as cards progress through phases
- Identify bottleneck phases (consistently red bars)
- Use historical data to improve future campaign planning
- Export drift reports for stakeholder communication
