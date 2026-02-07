# HACKATHON-OPTIMIZED PLAN: Full Features, Demo Implementation

## Strategy: "Wizard of Oz" Approach

- **Frontend:** Build ALL the UI features fully
- **Backend:** Seed data + minimal logic to make features appear to work
- **AI:** Real DeepSeek calls for recommendations, simulated for complex analysis
- **Demo Flow:** Pre-scripted with seeded data, but shows all capabilities

---

## CORE PRINCIPLE: Address ALL Evaluator Gaps with Smart Shortcuts

### What We're Keeping (All Critical Features)

#### Evaluator Gap #1: Override Learning System

- ✅ Override dialog with reason capture
- ✅ Observation mode UI
- ✅ Post-campaign outcome analysis display
- 🎯 Shortcut: Pre-seed one override example to show the learning loop

#### Evaluator Gap #2: Positive Drift Handling

- ✅ Drift classification (positive/negative/neutral)
- ✅ Success pattern extraction UI
- ✅ Template creation from positive drift
- 🎯 Shortcut: Pre-seed one "positive drift success story"

#### Evaluator Gap #3: Strategic Failure Diagnosis

- ✅ Full diagnosis UI (creative/targeting/timing/value prop)
- ✅ A/B test recommendations
- ✅ Confidence scoring
- 🎯 Shortcut: Use DeepSeek for real diagnosis, pre-seed one example

#### Evaluator Gap #4: Actionable Recommendations

- ✅ 3-tier system (Immediate/Tactical/Strategic)
- ✅ Implementation steps
- ✅ Impact/effort scoring
- ✅ Acceptance tracking
- 🎯 Shortcut: Real AI generation, but simple tracking

#### Agency Need #1: Accountability Mapping

- ✅ Stakeholder action logging UI
- ✅ Delay attribution (client vs agency)
- ✅ Approval cycle tracking
- 🎯 Shortcut: Manual logging during demo, pre-seed examples

#### Agency Need #2: Team Capacity Management

- ✅ Capacity dashboard
- ✅ Resource conflict warnings
- ✅ Overload alerts
- 🎯 Shortcut: Hardcoded team data, simple calculation

#### Agency Need #3: Client-Facing Reports

- ✅ PDF export button
- ✅ Professional report template
- ✅ Benchmark comparisons
- 🎯 Shortcut: Generate one sample PDF, show in demo

#### Agency Need #4: Pre-Launch Risk Scoring

- ✅ Full risk breakdown UI
- ✅ Timeline/resource/performance risks
- ✅ Decision gate
- 🎯 Shortcut: Simple calculation + AI enhancement

#### Meta Ads Integration

- ✅ Input fields for Pixel ID / Ads Account
- ✅ Performance metrics display
- ✅ Brand awareness tracking UI
- 🎯 Shortcut: Seed realistic sample data, show API structure in code

---

## PHASE 1: Setup & Data Foundation

### Step 1: Project Setup

- ✅ Create React + Vite project
- ✅ Install: Tailwind, Shadcn/UI, React Router, Recharts
- ✅ Initialize Supabase project
- ✅ Connect frontend to backend
- ✅ Skip: Auth, RLS, React Query (use simple useState/useEffect)

### Step 2: Database + Comprehensive Seed Data

- ✅ Create ALL tables (use Supabase Studio UI - faster than migrations):
  - campaigns, execution_phases, drift_events
  - risk_scores, recommendations, override_events
  - stakeholder_actions, team_capacity, team_members
  - performance_metrics, strategic_failures, campaign_templates

- ✅ SEED COMPLETE DEMO STORIES (this is critical):
   1. Successful Campaign (benchmark)
   2. Positive Drift Success (template creation example)
   3. Strategic Failure (diagnosis example)
   4. Override Example (learning loop demo)
   5. Accountability Example (client delay tracking)
   6. Team Capacity Conflict (resource warning)

> **Why This Matters:** Seed data lets you demo 90% of features without building complex backend logic

---

## PHASE 2: Core Campaign Flow UI

### Step 3: Campaign Creation

#### COMPREHENSIVE CAMPAIGN CREATION FORM

##### 1. CAMPAIGN FUNDAMENTALS

**Campaign Identity:**

- Campaign Name
- Campaign Type (New Product Launch, Seasonal Promo, Brand Awareness, Lead Gen, Retargeting, Event-Based)
- Start Date & End Date
- Total Budget
- Industry/Vertical

##### 2. CAMPAIGN OBJECTIVES & KPIs

**Primary Objective:**

- Sales (Direct Revenue)
- Lead Generation
- Brand Awareness
- Engagement
- Traffic
- App Installs
- Store Visits

**Primary KPI:**

- ROAS (Return on Ad Spend)
- CPA (Cost Per Acquisition)
- CPL (Cost Per Lead)
- CTR (Click-Through Rate)
- Engagement Rate
- Reach
- Video Views

- Target Value: [numeric]
- Secondary KPIs: [optional checkboxes]

##### 3. TARGET AUDIENCE

**Demographics:**

- Age Range (dropdown ranges: 18-24, 25-34, 35-44, 45-54, 55-64, 65+)
- Gender (Male, Female, All)
- Location Type (Local, Regional, National, International)
- Specific Locations (city/state/country input)
- Income Level (Optional: <$30k, $30-50k, $50-75k, $75-100k, $100k+)
- Education Level (Optional)

**Psychographics:**

- Interests/Hobbies (multi-select: Fitness, Tech, Fashion, Food, Travel, etc.)
- Behaviors (Online shoppers, Early adopters, Price-sensitive, Brand loyal)
- Life Events (Optional: New parents, Recently moved, Job change, etc.)

- Audience Size Estimate: [calculated or manual input]
- Audience Type:
  - [ ] Cold Audience (never interacted)
  - [ ] Warm Audience (website visitors, engagement)
  - [ ] Hot Audience (cart abandoners, past customers)
  - [ ] Lookalike/Similar Audiences

##### 4. CREATIVE STRATEGY

**Creative Format:**

- [ ] Static Images (quantity: ___)
- [ ] Video (15s, 30s, 60s+)
- [ ] Carousel (# of cards: ___)
- [ ] Stories/Reels
- [ ] Collection Ads
- [ ] Text-based

- Creative Theme/Concept: [text input]
- Key Message/Value Prop: [text input]
- Call-to-Action: (Shop Now, Learn More, Sign Up, Download, etc.)

**Creative Testing Plan:**

- [ ] A/B test different headlines
- [ ] A/B test different images/videos
- [ ] A/B test different CTAs
- [ ] No testing planned

##### 5. CHANNEL & PLACEMENT STRATEGY

- Primary Platform: (Meta Ads - Facebook/Instagram)

**Meta-Specific:**

- Facebook Placements:
  - [ ] Feed
  - [ ] Stories
  - [ ] Reels
  - [ ] Right Column
  - [ ] Marketplace
  - [ ] Video Feeds

- Instagram Placements:
  - [ ] Feed
  - [ ] Stories
  - [ ] Reels
  - [ ] Explore

- Automatic Placements: [ ] Yes / [ ] Manual Selection

**Optimization Goal:**

- Conversions
- Link Clicks
- Reach
- Engagement
- Video Views

##### 6. BUDGET STRATEGY

- Total Budget: $___
- Budget Allocation:
  - Daily Budget: $___
  - Lifetime Budget: $___

- Budget Distribution (if multiple ad sets):
  - Testing Phase Budget: ___% (first X days)
  - Scaling Phase Budget: ___% (after winners identified)

**Bidding Strategy:**

- [ ] Lowest Cost (automatic)
- [ ] Cost Cap (target CPA: $___)
- [ ] Bid Cap (max bid: $___)
- [ ] ROAS Goal (target ROAS: ___)

**Expected Performance Benchmarks:**

- Expected CTR: ___%
- Expected CPC: $___
- Expected Conversion Rate: ___%
- Expected CPA: $___

##### 7. EXECUTION TIMELINE

**Phase-by-Phase Planning:**

1. **Strategy & Planning Phase**
    - Duration: ___ days
    - Activities: Audience research, competitor analysis, KPI setting
    - Owner: [team member]
    - Dependencies: [list]

2. **Creative Development Phase**
    - Duration: ___ days
    - Activities: Design, copywriting, video production
    - Number of Creative Variants: ___
    - Owner: [team member]
    - Dependencies: Brand guidelines, product info

3. **Compliance & Approval Phase**
    - Duration: ___ days
    - Approvers: [Client, Legal, Brand team]
    - Known Bottlenecks: [text]
    - Dependencies: Creative completion

4. **Technical Setup Phase**
    - Duration: ___ days
    - Activities: Pixel/tracking setup, audience building, campaign structure
    - Technical Requirements:
       - [ ] Meta Pixel installed
       - [ ] Conversion events configured
       - [ ] Custom audiences created
       - [ ] UTM parameters defined
    - Owner: [team member]

5. **Launch Phase**
    - Duration: ___ days (usually 1-2)
    - Activities: Final QA, launch, monitoring
    - Launch Date: [specific date]

6. **Optimization Phase**
    - Duration: ___ days
    - Optimization Frequency: (Daily, Every 2 days, Weekly)
    - Activities: A/B testing, budget reallocation, audience refinement
    - Optimization Milestones:
       - Day 3: Initial results review
       - Day 7: Winner selection
       - Day 14: Scaling decisions

7. **Reporting Phase**
    - Duration: ___ days
    - Deliverables: Performance report, insights, recommendations

## 8. CONSTRAINTS & RISK FACTORS

**Known Constraints:**

- [ ] Compressed timeline (reason: ___)
- [ ] Limited budget vs. typical
- [ ] First campaign for this client/product
- [ ] Regulatory restrictions (specify: ___)
- [ ] Seasonal timing (holiday, event-based)
- [ ] Competitive market period

**Resource Constraints:**

- [ ] Limited creative resources
- [ ] New team member leading
- [ ] Outsourced creative production
- [ ] Client approval bottleneck (typical delay: ___ days)

**Historical Context:**

- Similar past campaigns: (select from list or "First time")
- Avg performance from past campaigns:
  - CTR: ___%
  - CPA: $___
  - ROAS: ___

### 9. TRACKING & MEASUREMENT SETUP

**Meta Ads Tracking:**

- Meta Pixel ID: [text input]
- Ads Account ID: [text input]
- Custom Conversion Events:
  - [ ] Purchase
  - [ ] Add to Cart
  - [ ] Lead
  - [ ] Complete Registration
  - [ ] Custom: [specify]

**External Tracking:**

- Google Analytics: [ ] Yes / [ ] No
- UTM Parameters: [text input]
- CRM Integration: [ ] Yes / [ ] No
- Promo Code: [text input] (for attribution)

**Brand Awareness Tracking** (if objective = awareness):

- [ ] Track Google Trends for [keyword]
- [ ] Track TikTok hashtag: #___
- [ ] Track YouTube search volume
- [ ] Track branded search lift

### 10. ​​COMPETITIVE & MARKET CONTEXT

**Competitive Landscape:**

- Market saturation: (Low, Medium, High)
- Number of Direct Competitors: ___
- Competitive Advantage: [text]
- Price Position: (Premium, Mid-range, Budget)

**Market Timing:**

- Seasonality Factor: (Peak, Off-peak, Neutral)
- Market Trends: (Growing, Stable, Declining)
- Relevant Events/Holidays: [text]

---

## Step 4: Pre-Launch Validation + Risk Scoring

- ✅ Risk Score Display (gauge, breakdown cards)
- ✅ Decision Gate UI (Proceed/Adjust/Pause badges)
- ✅ Override Dialog (reason capture with checkboxes)
- ✅ Risk calculation: SIMPLIFIED formula (no complex AI yet)
  - Budget vs historical avg
  - Timeline compression check
  - Team capacity check (if member data exists)
- ✅ Gate decision: score < 50 = pause, < 70 = adjust, else proceed

> **Implementation Note:** Risk calculation is simple math in Edge Function, NOT complex AI yet

### Step 5: Team Capacity Dashboard (UI Only)

- ✅ Display team members with utilization bars
- ✅ Show campaign assignments per member
- ✅ Color-code: green (<80%), yellow (80-90%), red (>90%)
- ✅ Warning badges for overloaded members
- ✅ Use hardcoded team data from seed

---

## PHASE 3: Execution Tracker + All Monitoring Features

### Step 6: Execution Tracker Core

- ✅ Phase timeline (visual cards showing status)
- ✅ Start Phase button (sets actual_start_date)
- ✅ Complete Phase button (calculates drift, creates drift_event)
- ✅ Drift display: +/- days with color coding
- ✅ Health indicators: Operational Health, Performance Health, Drift Count

### Step 7: Accountability Timeline

- ✅ Display stakeholder_actions in chronological order
- ✅ Show: who did what, when, deadline status
- ✅ Color-code: client (purple), agency (blue), external (gray)
- ✅ Highlight overdue approvals
- ✅ Use pre-seeded accountability data from demo campaigns

### Step 8: Drift Analysis Visualizations

- ✅ Simple bar chart: phases vs drift (Recharts)
- ✅ Drift summary cards: avg drift, positive/negative counts
- ✅ Positive drift highlights with "💡 Lesson Learned" callouts
- ✅ Template creation button (for positive drifts)

### Step 9: Performance Metrics Display

- ✅ Meta Ads metrics cards (impressions, CTR, ROAS, conversions)
- ✅ Brand awareness indicators (Google Trends score, TikTok volume)
- ✅ Charts showing trends over time
- ✅ Use seeded performance_metrics data
- ✅ Show Meta Pixel ID / Ads Account in UI (even if not pulling real data)

---

## PHASE 4: AI Recommendations System

### Step 10: Recommendations UI (Complete)

- ✅ 3-tier tabs: Immediate / Tactical / Strategic
- ✅ Recommendation cards with:
  - Tier badge, impact badge, effort badge, confidence score
  - Implementation steps (expandable)
  - Action buttons: Accept / Reject / Defer / Complete
- ✅ Feedback collection on completion
- ✅ Status tracking (suggested → accepted → completed)

### Step 11: ONE Real AI Integration

- ✅ Create generate-recommendations Edge Function
- ✅ Call DeepSeek for TACTICAL recommendations only
- ✅ Hardcode IMMEDIATE recommendations (from risk scores)
- ✅ Hardcode STRATEGIC recommendations (long-term suggestions)
- ✅ Store all recommendations in database

---

## PHASE 5: Strategic Failure Diagnosis (Hours 1-4)

### Step 12: Strategic Failure UI

- ✅ Detection: Display when drift < 1 day BUT performance < 70% target
- ✅ Diagnosis display:
  - Primary diagnosis with confidence %
  - Ranked hypotheses (creative/targeting/timing/value prop)
  - Evidence bullets for each hypothesis
  - Recommendations per diagnosis
- ✅ A/B Test Recommendations section:
  - Test type, hypothesis, setup, success criteria, time required
- ✅ Use pre-seeded strategic_failures data for demo

### Step 13: Real AI Diagnosis (If Time Permits)

- ✅ Create diagnose-strategic-failure Edge Function
- ✅ Call DeepSeek with campaign metrics + benchmarks
- ✅ Parse response into diagnoses array
- ✅ Fallback to seeded data if API fails

> **Shortcut:** Start with seeded example, add real AI only if time permits

---

## PHASE 6: Override Learning Loop Display

### Step 14: Override Outcome Analysis

- ✅ Add to completed campaigns with gate_overridden = TRUE
- ✅ Display section: "Override Decision Analysis"
  - System recommended: PAUSE
  - User action: Proceeded anyway
  - Reason provided: [display user's reason]
  - Outcome: Success/Failure with explanation
  - Lesson: "System was correct" or "User had valid context"
- ✅ Update override_events with outcome after campaign completes

### Step 15: Observation Mode Indicator

- ✅ When user overrides, show badge: "🔍 Observation Mode"
- ✅ During campaign execution, display:
   "We're monitoring this campaign closely since you proceeded against recommendation"
- ✅ Milestone checkpoints: "Day 3 of 7 - Performance update"

---

## PHASE 7: Positive Drift Template System

### Step 16: Template Creation UI

- ✅ On positive drift detection (drift_type = 'positive'):
  - Show "💡 Success Pattern Detected" alert
  - Display: what changed, why it worked, impact on performance
  - Button: "Save as Template"
- ✅ Template creation form:
  - Template name
  - Description (auto-filled from lesson_learned)
  - Which phases to include
  - Save to campaign_templates table

### Step 17: Template Usage

- ✅ In campaign creation, show "Use Template" button
- ✅ Display available templates from campaign_templates
- ✅ When selected, pre-populate phase durations and structure
- ✅ Show: "Based on [Campaign Name] which achieved [Result]"

---

## PHASE 8: Client-Facing Report

### Step 18: Report Generation

- ✅ Create simple HTML report template
- ✅ Sections:
  - Executive Summary (campaign name, dates, objective)
  - Execution Timeline (phases with drift)
  - Accountability Breakdown (who caused delays)
  - Performance Results (metrics vs targets)
  - Lessons Learned
- ✅ Use jsPDF or html2canvas to generate PDF
- ✅ "Download Report" button on completed campaigns

### Step 19: Report Preview

- ✅ Show generated report in modal before download
- ✅ Highlight key insights:
  - "Execution was clean" or "3 delays identified"
  - Client vs agency accountability split
  - Performance vs benchmark comparison
- ✅ Client-safe language (no blame, just facts)

---

## PHASE 9: Dashboard + Navigation Polish (Hours 14-15)

### Step 20: Dashboard Enhancements

- ✅ Campaign cards with smart routing:
  - Planning → /validate
  - In Progress → /tracker
  - Completed → /analytics
- ✅ Stats overview cards
- ✅ Filter by status
- ✅ Health indicators per campaign
- ✅ "Explore Examples" section (links to seeded campaigns)

### Step 21: Navigation & Layout

- ✅ Top navigation bar:
  - Logo/Brand
  - Links: Dashboard, Team Capacity, New Campaign
  - (No auth menu needed for demo)
- ✅ Consistent layout across all pages
- ✅ Breadcrumbs for deep pages
- ✅ Loading states everywhere

---

## FEATURE IMPLEMENTATION MATRIX

| Feature                   | UI   | Backend Logic      | Data Source             | Priority |
|---------------------------|------|--------------------|-------------------------|----------|
| Campaign Creation         | Full | Simple insert      | User input              | P0       |
| Pre-Launch Risk Scoring   | Full | Simple math        | Historical + formula    | P0       |
| Decision Gate + Override  | Full | Status updates     | override_events table   | P0       |
| Execution Tracker         | Full | Drift calculation  | Real-time phase updates | P0       |
| Drift Analysis Chart      | Full | Aggregation        | drift_events table      | P0       |
| 3-Tier Recommendations    | Full | AI (tactical only) | DeepSeek + hardcoded    | P0       |
| Team Capacity Dashboard   | Full | Simple calculation | Seeded team_capacity    | P1       |
| Accountability Timeline   | Full | Display only       | Seeded stakeholder_actions | P1    |
| Strategic Failure Diagnosis| Full | AI or seeded       | DeepSeek or pre-seeded  | P1       |
| Override Learning Display | Full | Display only       | Seeded override_events  | P1       |
| Positive Drift Templates  | Full | Simple CRUD        | campaign_templates      | P1       |
| Performance Metrics       | Full | Display only       | Seeded performance_metrics | P1    |
| Client Report PDF         | Full | HTML → PDF         | Campaign data           | P2       |
| Meta Ads Integration      | UI only | Show structure   | Seeded data            | P2       |
