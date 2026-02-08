# Strategic Failure Diagnosis Implementation

## Overview
The Strategic Failure Diagnosis system automatically detects and analyzes campaigns that execute well operationally but fail strategically, helping teams understand **why** campaigns underperform rather than just **when** they fail.

## Core Concept

### Detection Criteria (Per Design Spec)
**Trigger:** `drift < 1 day` AND `performance < 70% target`

This identifies campaigns where:
- ✅ **Operational execution was clean** (low drift = on-time delivery)
- ❌ **Strategic performance was poor** (below 70% of goal)

This pattern indicates **strategic issues** (creative, targeting, timing, value prop) rather than operational problems (delays, resource issues, approval bottlenecks).

## How It Works

### 1. Automatic Detection

The system continuously monitors all campaigns and automatically flags those meeting the criteria:

```typescript
// From strategicFailureService.ts
function detectStrategicFailure(campaign: Campaign, phases: ExecutionPhase[]): DetectionResult {
  // Calculate average drift from completed phases
  const avgDrift = completedPhases.reduce((sum, p) => sum + Math.abs(p.drift_days || 0), 0) / completedPhases.length
  
  const performanceHealth = campaign.performance_health || 100
  
  // Strategic failure: clean execution but poor performance
  const shouldTrigger = avgDrift < 1 && performanceHealth < 70
  
  return { shouldTrigger, avgDrift, performanceHealth, detectionCriteria }
}
```

### 2. Hypothesis Ranking

When a strategic failure is detected, the system calculates **likelihood scores (0-100)** for four potential root causes:

| Hypothesis | What It Means | Scoring Factors |
|------------|---------------|-----------------|
| **Creative Fatigue** | Ads aren't resonating with audience | Campaign type, creative phase timing, awareness focus |
| **Audience Mismatch** | Targeting wrong people | Targeting completeness, cold vs warm audience, audience definition |
| **Timing Issues** | Market timing is off | Launch delays, seasonal factors, Q4 sensitivity |
| **Value Proposition** | Offer doesn't justify price | Campaign objective, performance gap magnitude |

**Example Scoring Logic:**
```typescript
// Creative hypothesis scoring
if (campaign.primary_objective === 'brand_awareness') {
  creative += 15 // Awareness campaigns depend heavily on creative
}

// Targeting hypothesis scoring
if (!campaign.target_audience || Object.keys(campaign.target_audience).length === 0) {
  targeting += 25 // No targeting = likely mismatch
}
```

### 3. Primary Diagnosis

The **highest-scoring hypothesis** becomes the primary diagnosis, with confidence based on the separation from the second-place score:

```typescript
const separation = topScore - secondScore
const confidence = Math.min(0.95, 0.5 + (separation / 100))
```

### 4. Evidence Generation

The system generates evidence bullets supporting the diagnosis:
- Performance metrics (health %, gap from target)
- Execution quality confirmation (low drift rules out operational causes)
- Hypothesis-specific evidence (e.g., "Cold audience targeting increases risk of mismatch")

### 5. Actionable Recommendations

Based on the primary diagnosis, the system generates:
- **Recommended Actions**: 4-6 specific steps to address the root cause
- **A/B Test Suggestions**: Detailed test plans with setup instructions, success criteria, and expected impact
- **Prevention Strategies**: How to avoid this failure in future campaigns

## User Experience

### In Campaign Tracker

Navigate to campaign → **Failure Diagnosis** tab:

**State 1: No Strategic Failure**
```
✅ No Strategic Failures Detected

Campaign execution and performance are within acceptable parameters.

Detection triggers when: drift < 1 day AND performance < 70% target
```

**State 2: Strategic Failure Detected (Not Yet Analyzed)**
```
⚠️ Strategic Failure Detected

Low execution drift (0.5 days avg) with poor performance (62% health).
Indicates strategic rather than operational failure.

Detection Summary:
├─ Average Drift: 0.5 days
└─ Performance Health: 62%

[Generate AI Diagnosis] button
```

**State 3: Diagnosis Available**

Shows full analysis across 3 tabs:

1. **Diagnosis Tab**
   - Primary diagnosis with confidence score
   - Supporting evidence bullets
   - Recommended actions (numbered list)
   - Prevention strategies for future
   - Key lesson learned

2. **Hypotheses Tab**
   - All 4 hypotheses ranked by likelihood score
   - Visual progress bars showing scores
   - Interpretation guide (80-100 = highly likely, etc.)

3. **A/B Tests Tab**
   - 2-3 specific test recommendations per diagnosis
   - Control vs Test variant specifications
   - Step-by-step setup instructions
   - Success criteria
   - Expected impact & confidence level

## Example Diagnosis Output

### Audience Mismatch (Primary Diagnosis)

**Hypothesis Scores:**
- Audience Mismatch: **75** (Primary)
- Creative Fatigue: 55
- Value Proposition: 50
- Timing Issues: 45

**Confidence:** 70% (based on 20-point separation)

**Evidence:**
- Campaign performance at 65% of target (35% below expected)
- Low execution drift (0.8 days avg) rules out operational delays
- Cold audience targeting increases risk of audience mismatch
- Limited audience targeting parameters defined

**Recommended Actions:**
1. Narrow targeting to most qualified audience segments
2. Analyze current audience demographics in Meta Ads Manager
3. Create lookalike audiences from best-performing segments
4. Test different audience interest combinations
5. Set up detailed tracking to measure impact of changes

**A/B Test Suggestions:**

**Test 1: Audience Segmentation Test**
- **Hypothesis:** Narrower, more qualified audience will improve conversion efficiency
- **Control:** Current broad audience targeting
- **Test:** Narrowed audience with layered interests + behaviors
- **Setup:**
  1. Create refined audience combining top-performing demographics
  2. Layer interest targeting with behavioral signals
  3. Allocate 60% budget to test, 40% to control
  4. Monitor cost per result and ROAS daily
- **Success Criteria:** Test audience achieves 25%+ improvement
- **Expected Impact:** 20-40% CPA improvement
- **Confidence:** 80%
- **Duration:** 10 days

**Test 2: Lookalike Audience Test**
- **Hypothesis:** Lookalike from converters will outperform interest targeting
- **Control:** Current interest-based targeting
- **Test:** 1% lookalike audience from past converters
- (Additional details...)

## Database Schema

### strategic_failures Table

```sql
CREATE TABLE strategic_failures (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Detection
  detected_date DATE NOT NULL,
  detection_criteria TEXT NOT NULL,
  
  -- Primary Diagnosis
  primary_diagnosis TEXT NOT NULL, -- 'creative_fatigue', 'audience_mismatch', 'timing_issues', 'value_proposition'
  diagnosis_confidence DECIMAL(3,2) NOT NULL, -- 0.00-1.00
  
  -- Hypothesis Scores
  creative_hypothesis_score INTEGER (0-100),
  targeting_hypothesis_score INTEGER (0-100),
  timing_hypothesis_score INTEGER (0-100),
  value_prop_hypothesis_score INTEGER (0-100),
  
  -- Evidence & Analysis
  evidence_points TEXT[],
  performance_data JSONB,
  ai_analysis TEXT,
  ai_model_used TEXT,
  
  -- Recommendations
  recommended_actions TEXT[],
  ab_test_suggestions JSONB,
  
  -- Resolution Tracking
  resolution_actions TEXT[],
  resolved BOOLEAN DEFAULT FALSE,
  resolution_date DATE,
  post_resolution_performance JSONB,
  
  -- Learning
  lesson_learned TEXT,
  prevention_strategies TEXT[]
)
```

## API Usage

### Detect if Campaign Qualifies

```typescript
import { detectStrategicFailure } from '@/services/strategicFailureService'

const detection = detectStrategicFailure(campaign, phases)

if (detection.shouldTrigger) {
  console.log(`Strategic failure detected: ${detection.detectionCriteria}`)
  // Show "Generate Diagnosis" button to user
}
```

### Generate Diagnosis

```typescript
import { createStrategicFailure } from '@/services/strategicFailureService'

const { data, error } = await createStrategicFailure(campaign, phases)

if (data) {
  console.log('Diagnosis:', data.primary_diagnosis)
  console.log('Confidence:', data.diagnosis_confidence)
  console.log('Evidence:', data.evidence_points)
}
```

### Fetch Existing Diagnosis

```typescript
const { data: diagnosis } = await supabase
  .from('strategic_failures')
  .select('*')
  .eq('campaign_id', campaignId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

## Integration Points

### Campaign Tracker Page

The diagnosis automatically appears in the **Failure Diagnosis** tab when:
1. Campaign has completed phases (drift can be calculated)
2. Campaign meets detection criteria (drift < 1, performance < 70%)

The tab shows different states based on diagnosis availability:
- No failure → Green checkmark message
- Failure detected but not analyzed → Yellow alert with "Generate" button
- Diagnosis exists → Full analysis UI with 3 tabs

### Future Enhancements

**1. Real AI Integration (DeepSeek)**
Currently uses rule-based heuristics. Can enhance with:
```typescript
// In strategicFailureService.ts
async function callDeepSeekForDiagnosis(campaign, phases) {
  const prompt = `Analyze this campaign strategic failure:
    - Campaign: ${campaign.name}
    - Objective: ${campaign.primary_objective}
    - Avg Drift: ${avgDrift} days (clean execution)
    - Performance: ${performanceHealth}% (poor results)
    
    Diagnose the root cause and provide evidence.`
  
  const response = await fetch('DEEPSEEK_API', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  })
  
  return parseAIDiagnosis(response)
}
```

**2. Resolution Tracking**
Add UI to mark failures as resolved and track outcomes:
```typescript
// Mark as resolved
await supabase
  .from('strategic_failures')
  .update({
    resolved: true,
    resolution_date: new Date().toISOString(),
    resolution_actions: ['Changed targeting to lookalike audience', 'Refreshed creative assets'],
    post_resolution_performance: { roas: 3.2, cpa: 25 }
  })
  .eq('id', failureId)
```

**3. Template Generation**
When a failure is resolved successfully, create a template:
```typescript
// After successful resolution
await supabase
  .from('campaign_templates')
  .insert({
    name: `${diagnosis.primary_diagnosis} Resolution Playbook`,
    description: `Proven fix for ${diagnosis.primary_diagnosis}`,
    resolution_actions: failure.resolution_actions,
    success_metrics: failure.post_resolution_performance
  })
```

## Testing

### Create Test Campaign with Strategic Failure

```sql
-- Create campaign with low drift but poor performance
INSERT INTO campaigns (
  name, primary_kpi, target_value, performance_health, status
) VALUES (
  'Test Strategic Failure', 'roas', 3.0, 65, 'in_progress'
);

-- Add phases with minimal drift
INSERT INTO execution_phases (campaign_id, phase_name, drift_days, status) VALUES
  (campaign_id, 'Planning', 0, 'completed'),
  (campaign_id, 'Creative', 0.5, 'completed'),
  (campaign_id, 'Launch', 0, 'completed');
```

Navigate to campaign tracker → Failure Diagnosis tab → Should show detection alert → Click "Generate AI Diagnosis" → View full analysis

## Related Files

- **[strategicFailureService.ts](src/services/strategicFailureService.ts)** - Core detection and analysis logic
- **[StrategicFailureDiagnosis.tsx](src/components/diagnosis/StrategicFailureDiagnosis.tsx)** - UI component
- **[CampaignTracker.tsx](src/pages/CampaignTracker.tsx#L857-L925)** - Integration point
- **[database.ts](src/types/database.ts#L206-L233)** - TypeScript types
- **[database-schema.sql](database-schema.sql#L439-L480)** - Database schema

## Design Alignment

This implementation follows the design documents:

**From high_level_design.md:**
✅ Compares planned vs actual execution vs performance  
✅ Answers: "Did deviations affect performance?" and "What should change next time?"  
✅ Classifies as operational failure vs strategic failure  
✅ Identifies root causes (creative, targeting, timing, value prop)

**From sprint_workflow.md:**
✅ Detection: drift < 1 day BUT performance < 70% target  
✅ Primary diagnosis with confidence %  
✅ Ranked hypotheses with scores  
✅ Evidence bullets supporting diagnosis  
✅ A/B test recommendations with setup instructions  
✅ Pre-seeded example capability (can seed data manually)
