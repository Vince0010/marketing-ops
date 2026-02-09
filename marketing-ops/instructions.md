# Marketing Ops Tracking System - Kanban Integration Instructions

## Overview
This document outlines the implementation of a Kanban board system that tracks marketer actions, correlates them with performance data, and uses AI to identify causal relationships and suggest corrective actions.

## Core Workflow

### 1. Kanban Board Setup

#### Action Categories (Columns)
```
- Planned Actions
- In Progress
- Completed
- Reverted
```

#### Task Types (Cards)
Each card represents a specific marketing action with the following properties:

**Card Structure:**
```javascript
{
  id: "unique_id",
  action_type: "creative_change" | "budget_adjustment" | "audience_targeting" | "ad_copy_update" | "posting_schedule_change",
  title: "Changed hero image from blue to red",
  description: "Updated main ad creative to test color psychology",
  timestamp: "2025-02-07T10:30:00Z",
  campaign_id: "campaign_123",
  metadata: {
    previous_state: { creative_url: "blue_hero.jpg" },
    new_state: { creative_url: "red_hero.jpg" },
    affected_ad_sets: ["ad_set_1", "ad_set_2"]
  },
  status: "completed",
  created_by: "sarah@marketing.com"
}
```

#### Predefined Action Templates
Create pre-filled card templates based on common workflow phases:

1. **Creative Actions**
   - Updated ad creative
   - Changed headline/copy
   - Modified CTA button
   - Swapped product image

2. **Targeting Actions**
   - Adjusted audience parameters
   - Changed geographic targeting
   - Modified demographic filters
   - Updated interest targeting

3. **Budget Actions**
   - Increased daily budget
   - Decreased daily budget
   - Reallocated budget between ad sets

4. **Optimization Actions**
   - Paused underperforming ads
   - Duplicated winning ad sets
   - Changed bidding strategy

### 2. Data Stream Integration

#### Seeded Data Structure

**Performance Metrics (Daily Snapshots):**
```javascript
// Store in Supabase table: `performance_snapshots`
{
  id: "snapshot_001",
  campaign_id: "campaign_123",
  date: "2025-02-07",
  metrics: {
    sales: 500,
    roas: 3.2,
    cpa: 15.50,
    impressions: 45000,
    clicks: 1200,
    conversions: 32,
    revenue: 16000
  },
  data_source: "meta_pixel",
  snapshot_time: "23:59:59"
}
```

**Meta Pixel Events (Simulated):**
```javascript
// Store in Supabase table: `tracking_events`
{
  event_id: "evt_001",
  campaign_id: "campaign_123",
  event_type: "Purchase" | "AddToCart" | "ViewContent" | "Lead",
  event_time: "2025-02-07T14:23:00Z",
  value: 49.99,
  currency: "USD",
  metadata: {
    product_id: "prod_123",
    category: "electronics"
  }
}
```

#### Seed Data Generation Script

Create a data seeding script that generates:
- **7-14 days** of historical performance data
- **3-5 marketer actions** per campaign
- **Performance changes** that correlate with actions (intentional causality for demo)

**Example Scenario:**
```
Day 1: Baseline performance ($500 sales, 30 conversions)
Day 2 (Morning): Marketer changes creative (blue → red)
Day 2 (Evening): Performance starts declining
Day 3: Sales drop to $200 (60% decrease)
Day 4: Marketer reverts creative
Day 5: Sales recover to $450
```

### 3. AI Correlation Engine

#### Detection Logic

**Step 1: Event Timeline Construction**
```javascript
// Combine marketer actions + performance data
timeline = [
  { type: "action", timestamp: "Day 2, 10:00", action: "creative_change", details: "blue → red" },
  { type: "metric", timestamp: "Day 2, 23:59", sales: 480, change: -4% },
  { type: "metric", timestamp: "Day 3, 23:59", sales: 200, change: -58% },
  { type: "action", timestamp: "Day 4, 09:00", action: "creative_revert", details: "red → blue" },
  { type: "metric", timestamp: "Day 5, 23:59", sales: 450, change: +125% }
]
```

**Step 2: Correlation Detection Rules**

Use DeepSeek AI with the following prompt structure:

```
Analyze this campaign timeline and identify causal relationships:

ACTIONS TAKEN:
{action_timeline}

PERFORMANCE DATA:
{performance_timeline}

TASK:
1. Identify any significant metric changes (>20% deviation)
2. Check if actions occurred 0-48 hours before metric changes
3. Determine correlation strength (Strong/Moderate/Weak)
4. Generate alert if correlation is Strong or Moderate
5. Suggest corrective action if performance declined

OUTPUT FORMAT:
{
  "correlation_detected": true/false,
  "confidence": "high" | "medium" | "low",
  "insight": "Sales dropped 60% within 24 hours of creative change",
  "affected_metrics": ["sales", "roas"],
  "suspected_cause": {
    "action_id": "action_123",
    "action_type": "creative_change",
    "time_delta_hours": 14
  },
  "recommendation": {
    "action": "revert_creative",
    "priority": "high",
    "rationale": "Performance degraded significantly post-change. Historical data shows this creative performed well."
  }
}
```

**Step 3: Alert Generation**

When AI detects correlation:
```javascript
// Store in Supabase table: `ai_alerts`
{
  alert_id: "alert_001",
  campaign_id: "campaign_123",
  severity: "high" | "medium" | "low",
  title: "Sales dropped after creative change",
  description: "Sales decreased by 60% within 24 hours of changing ad creative from blue to red hero image",
  detected_at: "2025-02-09T08:00:00Z",
  correlation_data: {
    trigger_action_id: "action_123",
    affected_metrics: ["sales", "revenue"],
    time_window: "24_hours",
    confidence_score: 0.87
  },
  suggested_action: {
    type: "revert",
    target_action_id: "action_123",
    button_label: "Revert to previous creative",
    auto_executable: true
  },
  status: "active" | "resolved" | "dismissed"
}
```

### 4. User Interface Components

#### Kanban Board View

**Features:**
- Drag-and-drop cards between columns
- Timestamp badges on each card
- Color-coded cards (green = positive impact, red = negative correlation detected, gray = neutral)
- Quick-add button for common actions
- Filter by campaign, date range, action type

**Card Display:**
```
┌─────────────────────────────────────┐
│ 🎨 Updated Ad Creative              │
│ Changed hero image: blue → red      │
├─────────────────────────────────────┤
│ ⚠️ Alert: Sales dropped 60%        │
│ 📊 Correlation detected (High conf) │
│ [Revert Creative] [View Details]    │
├─────────────────────────────────────┤
│ 🕐 Feb 7, 10:30 AM                  │
│ 👤 Sarah M.                          │
└─────────────────────────────────────┘
```

#### Alert Dashboard

Display active AI-generated alerts with:
- Alert severity indicator
- Metric impact visualization (before/after chart)
- Timeline showing action → metric change sequence
- One-click action buttons
- Historical view of resolved alerts

#### Performance Correlation View

Side-by-side timeline showing:
- **Left track:** Marketer actions (as events on timeline)
- **Right track:** Performance metrics (line chart)
- **Connecting lines:** Visual links between correlated actions and metric changes
- **Annotations:** AI-generated insights as tooltips

### 5. Implementation Steps

#### Phase 1: Database Schema
```sql
-- Kanban actions
CREATE TABLE marketer_actions (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  action_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  timestamp TIMESTAMPTZ,
  metadata JSONB,
  status VARCHAR(20),
  created_by VARCHAR(100)
);

-- Performance snapshots
CREATE TABLE performance_snapshots (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  date DATE,
  metrics JSONB,
  data_source VARCHAR(50),
  snapshot_time TIME
);

-- AI-generated alerts
CREATE TABLE ai_alerts (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  severity VARCHAR(20),
  title VARCHAR(255),
  description TEXT,
  detected_at TIMESTAMPTZ,
  correlation_data JSONB,
  suggested_action JSONB,
  status VARCHAR(20)
);

-- Action-metric correlations
CREATE TABLE correlations (
  id UUID PRIMARY KEY,
  action_id UUID REFERENCES marketer_actions(id),
  metric_snapshot_id UUID REFERENCES performance_snapshots(id),
  correlation_strength DECIMAL(3,2),
  confidence_level VARCHAR(20),
  ai_insight TEXT,
  detected_at TIMESTAMPTZ
);
```

#### Phase 2: Seed Data Script
Create `seed_demo_data.js`:
```javascript
// Generate 3 demo campaigns with realistic scenarios
// Scenario 1: Creative change causes sales drop
// Scenario 2: Budget increase improves performance
// Scenario 3: Audience targeting adjustment - mixed results
```

#### Phase 3: AI Integration
```javascript
// API route: /api/analyze-correlations
// Runs every hour (or on-demand) to:
// 1. Fetch recent actions (last 48 hours)
// 2. Fetch performance data (last 7 days)
// 3. Send to DeepSeek API
// 4. Store correlations and generate alerts
```

#### Phase 4: Frontend Components
- `<KanbanBoard>` - Main board with drag-drop
- `<ActionCard>` - Individual action card
- `<AlertBanner>` - Top-of-page alerts
- `<CorrelationTimeline>` - Visual timeline
- `<QuickActionModal>` - Add new actions

### 6. Demo Flow Script

**Presenter Walkthrough:**

1. **Show Kanban Board**
   - "Here's where marketers track their daily actions"
   - Point to completed cards from past few days

2. **Highlight Recent Action**
   - "Sarah changed the ad creative 2 days ago - blue to red"
   - Show card with metadata

3. **Navigate to Alert Dashboard**
   - "The AI detected something interesting..."
   - Show alert: "Sales dropped 60% after creative change"

4. **Click Alert for Details**
   - Display before/after metrics side-by-side
   - Show correlation confidence: 87%
   - Timeline visualization

5. **Execute Revert Action**
   - Click "Revert to previous creative"
   - System creates new action card automatically
   - Show success message

6. **Show Recovery (Next Day Data)**
   - "The next day, sales recovered to $450"
   - Highlight the correlation in timeline view
   - AI marks alert as "Resolved"

### 7. Technical Notes

#### Data Freshness
- Performance snapshots: Daily at midnight (seeded for demo)
- AI analysis runs: Every 4 hours (simulated as pre-computed for demo)
- Kanban updates: Real-time via Supabase subscriptions

#### Correlation Thresholds
```javascript
const CORRELATION_RULES = {
  metric_change_threshold: 0.20, // 20% change
  time_window_hours: 48,          // Look back 48 hours
  min_confidence_to_alert: 0.70,  // 70% confidence
  severe_change_threshold: 0.50   // 50% change = high severity
}
```

#### AI Prompt Template
```
You are analyzing marketing campaign execution data.

CONTEXT:
Campaign: {campaign_name}
Objective: {objective}
Current metrics: {current_metrics}

RECENT ACTIONS:
{formatted_action_list}

PERFORMANCE TIMELINE:
{formatted_metrics_timeline}

ANALYZE:
1. Did any metric change by >20% in the last 48 hours?
2. Did any marketer action occur 0-48 hours before the change?
3. What is the likely correlation strength?
4. Should we alert the marketer?
5. What action should be recommended?

Respond in JSON format only.
```

### 8. Future Enhancements (Post-Demo)

- Real-time Meta API integration
- Multi-platform tracking (Google Ads, TikTok)
- Advanced ML models for predictive alerts
- A/B test correlation tracking
- Team collaboration features
- Automated action execution (with approval workflow)

---

## Quick Start for Demo Setup

1. **Seed database:** `npm run seed:demo`
2. **Start frontend:** `npm run dev`
3. **Verify data:** Check Supabase tables populated
4. **Run AI analysis:** `npm run analyze:correlations`
5. **Open Kanban view:** Navigate to `/campaigns/[id]/kanban`

The demo should show 2-3 campaigns with pre-populated actions, correlated metric changes, and active AI alerts ready to demonstrate.