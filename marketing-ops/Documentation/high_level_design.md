# High-Level Design (HLD): Marketing Ops Tracking System

**Project Name:** Expedition Challenge: #3 Marketing Ops Tracking

## Problem Statement

Marketing execution often breaks down between strategy and delivery, but teams lack a way to track how campaigns actually execute, why they succeed or fail operationally, and how to learn from execution over time.

## Core Mission

Build a platform where campaigns are planned with intent, tracked through execution, and evaluated afterward, using structured inputs and AI-driven analysis to surface operational breakdowns, execution patterns, and actionable improvements for future campaigns.

## Solution Overview

The Marketing Ops Tracking System is an intelligent, end-to-end campaign management platform that bridges the gap between strategic intent and operational execution, with an MVP focused on Facebook and Instagram campaigns via Meta Ads.

It allows marketing teams to:

- Define clear objectives and KPIs
- Plan execution phases with resources and constraints
- Track real-time campaign progress
- Analyze performance outcomes

By comparing planned intent, actual execution, and results, the platform identifies operational bottlenecks, explains why campaigns succeed or fail, predicts delays, and provides AI-driven prescriptive recommendations, enabling teams to optimize current campaigns and continuously improve future initiatives.

## How It Works

### Step 1: Campaign Flow

This flow tracks how campaigns execute operationally so execution quality can be compared against performance results to diagnose whether failures stem from operational breakdowns or strategic issues.

#### Parameters to Determine Success or Failure

**Success & Failure Metrics:**

- **Operational Health:** Is the operation on time?
- **Performance Health:** Is the campaign making money and gaining visibility?

#### Flow for Drift Analysis

```
1. Plan Campaign
   - Define campaign timeline per stage
   - Example: Planning takes 3 days
   - Set execution phases and constraints using customizable framework
   
            ↓
            
2. Track Execution
   - Monitor phase progress in real time
   - Log actual start and completion times
   - Track how long each phase takes
   
            ↓
            
3. Calculate Drift
   - Compare planned vs. actual timelines
   - DRIFT = ACTUAL - PLANNED (Difference in Days)
   - Identify delays, accelerations, and violations
   
            ↓
            
4. Analyze Impact
   - Correlate execution drift with performance metrics
   - Detect operational vs. strategic causes
   
            ↓
            
5. Recommend Actions
   - Prescribe fixes for current campaign
   - Surface preventive improvements for future campaigns
```

1.1 Campaign Setup (Intent)
Campaign name
Objective (Sales, Leads, Awareness)
Industry / Category
Budget & audience
Timeline per stage
Tracking IDs (Meta Pixel, Ads Account)
1.2 Execution Blueprint (How It Will Run)
Execution phases (can be customized):
Planning
Creative
Compliance
Launch
Optimization
Planned duration per phase
Required assets
Teams involved
Tools & platforms
1.3 Success Definition (What “Good” Means)
Primary KPI (Sales, ROAS, CPA, Engagement)
Numeric target
Time window
1.4 Feasibility & Risk Assessment (Reality Check)
System evaluates:
Timeline compression risk
Asset overload risk
Approval bottlenecks
Tracking dependencies
Outputs:
Feasibility score
Risk list (no solutions yet)
Historical benchmark comparison
1.5 Decision Gate
After the system evaluates, the system will flag the campaign execution as:
Proceed
Adjust
Pause
The system may also provide fix prescriptions based on historical pattern (only if there are available data from previous iteration with almost the same values in the involved variables: ex. same campaign timeline duration and type)
**Sample of Drift Analysis:**

| Phase | Planned Duration | Actual Duration | Drift (Days) | Status |
|-------|------------------|-----------------|--------------|--------|
| Planning | 3 days | 3 days | 0 | On Track |
| Creative | 5 days | 7 days | +2 | At Risk |
| Compliance | 7 days | 10 days | +3 | Blocked |
| Launch | 1 day | — | — | Pending |

### Step 2: Execution Tracker

#### Flow for Meta Ads

```
User inputs Ad Link
        ↓
Pull Brand Awareness Flow
        ↓
Pull Sales Generation Flow
```

#### Step 2.1: Brand Awareness Flow

AI will generate keywords and hashtags related to the campaign based on inputted campaign goals. Users can manually edit the generated keywords and add specific inputs.

**Data Sources:**

- **Meta Ads API (Facebook + Instagram)**
  - Tracks how people interact with your campaign ads on Facebook and Instagram
  - Engagement rates of the campaign

- **Google Trends API**
  - Fetches the Search Interest Over Time – Relative search volume (0-100 scale) graph
  - Tracks whether users are actively searching for the campaign on Google

- **TikTok Creative Center**
  - Fetches how a hashtag related to the campaign is actively being searched on TikTok
  - Provides hashtag search volume data

- **YouTube Data API v3**
  - Tracks search volume, video mentions, and trending content related to your campaign

- **Google Alerts (Social Listening Tool)**
  - Finds new mentions related to the campaign through Gmail notifications
  - Uses Gmail API to capture, parse, and process these emails to feed the data

#### Step 2.2: Sales Generation Flow

System will track engagement on the user's webpage through event listeners.

**Data Sources:**

- **Website Event Tracking (Event Listeners)**
  - JavaScript code on the client's website tracks every user interaction
  - A custom event must trigger after a successful transaction that passes information about this success (the total earnings) back to the system

- **Meta Pixel (Facebook Pixel)**
  - Tracks conversions from Meta ads (Facebook/Instagram)
  - This only applies to apps with Meta Pixel installed into their websites/apps

- **Promo Code Tracking**
  - Directly attributes sales to campaign via unique promo codes

### How the Comparison Works (Why Did the Execution Fail?)

At every stage, the system answers four diagnostic questions:

1. Did we run the campaign the way we planned?
2. If not, where did execution deviate?
3. Did those deviations materially affect performance?
4. What should be changed next time to prevent recurrence?
5. Intent vs. Execution Comparison
The system compares the planned execution blueprint against actual execution data.
What Is Compared
Planned phase durations vs. actual durations
Planned launch date vs. actual launch date
Planned assets vs. delivered assets
Planned approvals vs. actual approval cycles
What the User Sees
Phase-level drift (early, on-time, delayed)
Severity of drift (minor, at risk, blocked)
Identification of the first point of failure (root delay origin)
6. Execution vs. Performance Comparison
The system correlates execution drift with performance metrics to determine causality.
What Is Compared
Drift magnitude vs. KPI movement
Launch delays vs. conversion windows
Phase delays vs. engagement or revenue drop-off
What the User Sees
Whether performance failure aligns with execution failure
Whether the campaign underperformed despite clean execution
Sample Insights:
Operational failure:

 “ROAS declined 31% following a 5-day launch delay that pushed the campaign outside its peak demand window.”

Strategic failure:

 “Campaign launched on time with no execution drift. Performance underperformance likely driven by creative or targeting.”

#### 3. Expected vs. Observed Outcome Comparison

The system compares the campaign against:

- The user's past campaigns
- Industry benchmarks
- Platform-wide execution patterns for the same campaign type

**What Is Compared:**

- Typical phase durations vs. observed durations
- Typical delay points vs. actual delay points
- Typical performance sensitivity vs. observed sensitivity

**What the User Sees:**

- Whether delays were predictable or anomalous
- Whether performance drop was disproportionate to execution issues

#### 4. Before vs. After Change Comparison

When changes are made mid-campaign (creative swaps, budget shifts, targeting changes), the system compares pre-change vs. post-change performance in the context of execution state.

**What Is Compared:**

- Performance before vs. after execution changes
- Execution stability before vs. after changes

**What the User Sees:**

- Whether performance changes correlate with execution disruptions
- Whether reverting a change is advisable

### Step 3: AI Analytics & Outputs

The AI layer (using DeepSeek) in this system serves as the intelligent core that analyzes campaign execution, performance metrics, and historical patterns to produce actionable insights. It does not replace human judgment but augments it with predictive, prescriptive, and diagnostic intelligence.

#### AI Inputs

The AI engine ingests multiple structured and unstructured data sources:

- **Execution Data:** Phase start/end times, asset completion, approval cycles, team assignments, drift events
- **Performance Metrics:** ROAS, CPA, engagement rates, impressions, conversions, promo codes
- **Historical Campaign Data:** Past campaigns within the organization, cross-platform execution patterns
- **External Benchmarks:** Industry campaign benchmarks, platform-wide performance statistics
- **Changes & Interventions:** Mid-campaign adjustments such as creative swaps, budget changes, targeting changes

#### AI Processing & Models

The AI performs multiple layers of analysis:

**1. Drift Analysis & Risk Scoring**

- Compares planned vs actual execution timelines
- Computes phase-level drift and cumulative campaign drift
- Predicts delay likelihood for upcoming phases using historical and structural patterns

**2. Execution-Performance Correlation**

- Identifies causal relationships between execution deviations and performance outcomes
- Classifies issues as operational failures (execution-related) or strategic failures (objective-related)

**3. Comparative Performance Analysis**

- Pre/post intervention analysis: Measures the impact of changes during a campaign
- Benchmarks current campaign against historical and industry performance

**4. Prescriptive Recommendations**

- Suggests actions to correct current campaigns (reverse, pivot, or optimize)
- Recommends preventive measures for future campaigns (timeline adjustments, asset scope reduction, parallelizing approvals)

#### AI Outputs

The system produces three main types of outputs that are surfaced to users in dashboards, notifications, and reports:

| Output Type | Description | Delivered To Users |
|-------------|-------------|--------------------|
| **Diagnostic Insights** | Explains why a campaign underperformed or where execution failed | Phase-level root cause identification, severity tags (On Track / At Risk / Blocked), drift reports |
| **Predictive Alerts** | Forecasts potential execution or performance risks before they occur | Phase-level risk scores, probability of delay, bottleneck warnings, escalation alerts |
| **Prescriptive Recommendations** | Suggests actions to fix or prevent execution issues | Step-by-step guidance: e.g., reduce assets, extend phase duration, parallelize approvals, revert creative changes |
| **Cross-Campaign Learning** | Identifies patterns across campaigns | Recommendations for best practices, benchmark-based expectations, predictive phase durations for new campaigns |
| **Visualization Outputs** | Graphical representation of insights | Timeline drift charts, KPI correlation graphs, before/after change impact dashboards |
| **Confidence Scores & Explainability** | Provides a confidence rating for each AI insight | High / Medium / Low confidence, with rationale (based on historical similarity, sample size, and metric variability) |

## Technical Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + Shadcn/UI
- **Backend:** Supabase
- **AI:** DeepSeek

## Value Proposition For Marketing Ops HEAD

1. **Financial Impact (ROI Justification)**
2. **Career Protection (CYA Value)**
3. **Executive Reporting (Visibility Value)**
4. **Team Efficiency (Productivity Value)**
5. **Scalability (Growth Value)**
Competitor Analysis
App / Platform
Gaps / What They Can’t Do
What Our Platform Does
Asana / Monday.com

- Cannot analyze campaign execution quality
- No real-time drift detection
- Limited correlation between execution and results
AI-generated, actionable insights, Real-time drift detection, Execution performance correlation
TripleWhale
- Cannot track operational execution
- Limited insights on why campaigns underperform
- No constraint-aware planning
Tracks execution vs plan, Prescriptive AI recommendations, Constraint-aware planning
Enterprise Suites (e.g., Adobe, Salesforce Marketing Cloud)
- Siloed data makes root-cause analysis hard
- Heavily manual insights
- Slow time-to-value (months)
- High setup complexity

**What Our Platform Does:** • Automatic cause-effect correlation<br>• AI recommendations and preventive guidance<br>• Low-medium setup, faster time-to-value |

| **Generic BI / Analytics Tools** | • Only show what happened, not why<br>• No predictive delay risk or execution intelligence<br>• No cross-campaign learning | • Explains why execution failed<br>• Predictive delay & drift alerts<br>• Learning compounds over time |
