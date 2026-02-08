# Override Learning System

## Overview

The Override Learning System tracks when users override AI recommendations, monitors campaign outcomes, and automatically evaluates whether the override was justified. This creates a feedback loop that helps the AI improve future recommendations.

## How It Works

### 1. Override Capture (Decision Gate)

When a user overrides a risk gate recommendation during campaign validation:

```typescript
// Stored in override_events table
{
  override_type: 'gate_decision',
  original_recommendation: 'pause',  // What AI suggested
  user_action: 'proceed',            // What user chose
  reason: 'Market trend data shows...',  // User's justification
  system_confidence: 72,             // AI's confidence level
  risk_score_at_time: 72            // Risk score when override happened
}
```

**Location:** [CampaignValidate.tsx](../src/pages/CampaignValidate.tsx) - Override dialog

### 2. Observation Mode (During Execution)

While the campaign runs, the system monitors it in "observation mode":

- Shows milestone progress (Day 3, 7, 14, 21, 28)
- Displays performance trend indicators:
  - 🟢 Green (≥90% of target): "On track to meet target"
  - 🟡 Yellow (70-90%): "Moderate performance"  
  - 🔴 Red (<70%): "Below expected trajectory"

**Location:** [ObservationModeBadge.tsx](../src/components/ObservationModeBadge.tsx)

### 3. Campaign Completion Trigger

When the final execution phase is marked complete:

```typescript
// In CampaignTracker.tsx - handleCompletePhase()
if (isLastPhase && campaign) {
  await campaignCompletionService.processCampaignCompletion(campaign.id)
}
```

**Location:** [CampaignTracker.tsx](../src/pages/CampaignTracker.tsx#L353-L382)

### 4. Performance Calculation

The system aggregates performance metrics and determines success:

```typescript
// In calculations.ts
const outcome = calculateFinalPerformance(campaign, performanceMetrics)

// Returns:
{
  success: 'success' | 'failure' | 'partial_success',
  finalMetricValue: 3.6,
  targetValue: 3.0,
  achievementRate: 120.0,
  explanation: "Campaign exceeded target ROAS of 3 with actual 3.60..."
}
```

**Thresholds:**
- ≥100% of target → **Success**
- 80-99% of target → **Partial Success**
- <80% of target → **Failure**

**Location:** [calculations.ts](../src/utils/calculations.ts#L336-L394)

### 5. Override Outcome Evaluation

The system evaluates whether the user's override was justified:

```typescript
const evaluation = evaluateOverrideOutcome(campaign, overrideEvent, campaignOutcome)

// Returns:
{
  outcome: 'success',
  outcome_explanation: "User correctly overrode the pause recommendation...",
  lesson_learned: "High risk score did not prevent success. User's contextual judgment was valid...",
  system_was_correct: false  // User was right to override
}
```

**Logic:**
- If AI said "pause" and user "proceeded":
  - Campaign **succeeds** → `system_was_correct = false` (user was right)
  - Campaign **fails** → `system_was_correct = true` (AI was right)

**Location:** [calculations.ts](../src/utils/calculations.ts#L405-L475)

### 6. Database Update

The override_events record is updated with outcome analysis:

```sql
UPDATE override_events SET
  outcome = 'success',
  outcome_explanation = '...',
  lesson_learned = '...',
  system_was_correct = false,
  reviewed_at = NOW()
WHERE id = 'override_event_id';
```

**Location:** [campaignCompletionService.ts](../src/services/campaignCompletionService.ts#L77-L105)

### 7. Display in Analytics

The override outcome is shown in the Campaign Analytics page:

**Location:** [CampaignAnalytics.tsx](../src/pages/CampaignAnalytics.tsx#L317-L323)

Uses: [OverrideOutcomeAnalysis.tsx](../src/components/diagnosis/OverrideOutcomeAnalysis.tsx)

## Testing

Run the test script to verify the system:

```bash
npm run test:override-learning

# Or manually:
node --import tsx scripts/test-override-learning.ts
```

The test will:
1. Find campaigns with overrides
2. Calculate final performance
3. Evaluate override decisions
4. Update database with outcomes
5. Display results

## Key Files

| File | Purpose |
|------|---------|
| [calculations.ts](../src/utils/calculations.ts) | Core logic: `calculateFinalPerformance()`, `evaluateOverrideOutcome()` |
| [campaignCompletionService.ts](../src/services/campaignCompletionService.ts) | Orchestrates completion and override processing |
| [CampaignTracker.tsx](../src/pages/CampaignTracker.tsx) | Triggers completion when last phase finishes |
| [CampaignAnalytics.tsx](../src/pages/CampaignAnalytics.tsx) | Displays override outcomes |
| [ObservationModeBadge.tsx](../src/components/ObservationModeBadge.tsx) | Shows monitoring status during execution |
| [OverrideOutcomeAnalysis.tsx](../src/components/diagnosis/OverrideOutcomeAnalysis.tsx) | Displays detailed outcome analysis |

## Database Schema

```sql
CREATE TABLE override_events (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL,
  override_type TEXT NOT NULL,
  original_recommendation TEXT NOT NULL,
  user_action TEXT NOT NULL,
  reason TEXT NOT NULL,
  system_confidence INTEGER,
  risk_score_at_time INTEGER,
  
  -- Populated post-campaign:
  outcome TEXT,  -- 'success', 'failure', 'partial_success'
  outcome_explanation TEXT,
  lesson_learned TEXT,
  system_was_correct BOOLEAN,
  reviewed_at TIMESTAMPTZ,
  
  overridden_by TEXT
);
```

## Example Flow

1. **Campaign Creation:** User creates "GreenHome Eco Products" campaign
2. **Risk Assessment:** System calculates risk score: 72 (High) → Recommends: **PAUSE**
3. **Override:** User overrides with reason: "Market trends show growing eco segment"
4. **Execution:** Campaign runs in observation mode with milestone tracking
5. **Completion:** Final phase completes → Triggers automatic processing
6. **Evaluation:** 
   - Final ROAS: 3.6 vs Target: 3.0 → **120% achievement → Success**
   - System evaluates: User override was **CORRECT**
   - Lesson: "High risk score did not prevent success. Consider adjusting risk thresholds..."
7. **Display:** Analytics page shows override decision analysis

## Future Enhancements

- [ ] Aggregate override patterns across campaigns
- [ ] Use outcomes to retrain risk assessment model
- [ ] Show override success rate by user/team
- [ ] Predictive "override likelihood" scoring
- [ ] Automated A/B testing of risk thresholds
