# Campaign AI - Complete React + TypeScript Project Structure

## 📁 Project Structure Overview

```
campaign-ai/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Select.tsx
│   │   ├── campaigns/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── CampaignStats.tsx
│   │   │   └── CampaignFilters.tsx
│   │   ├── phases/
│   │   │   ├── PhaseTimeline.tsx
│   │   │   ├── PhaseCard.tsx
│   │   │   └── DriftIndicator.tsx
│   │   ├── recommendations/
│   │   │   ├── RecommendationCard.tsx
│   │   │   └── RecommendationTabs.tsx
│   │   ├── team/
│   │   │   ├── TeamMemberCard.tsx
│   │   │   └── UtilizationBar.tsx
│   │   ├── analytics/
│   │   │   ├── DriftChart.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── MetricsCard.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── PageLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── CampaignCreate.tsx
│   │   ├── CampaignValidate.tsx
│   │   ├── ExecutionTracker.tsx
│   │   ├── Analytics.tsx
│   │   └── TeamCapacity.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── types/
│   │   ├── campaign.ts
│   │   ├── phase.ts
│   │   ├── recommendation.ts
│   │   ├── team.ts
│   │   └── database.ts
│   ├── hooks/
│   │   ├── useCampaigns.ts
│   │   ├── usePhases.ts
│   │   └── useRecommendations.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── calculations.ts
│   │   └── formatting.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## 🚀 Step 1: Initialize Project

```bash
npm create vite@latest campaign-ai -- --template react-ts
cd campaign-ai
npm install
```

---

## 📦 Step 2: Install Dependencies

```bash
# Core dependencies
npm install react-router-dom recharts lucide-react date-fns @supabase/supabase-js

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# UI utilities
npm install class-variance-authority clsx tailwind-merge

# Optional: Radix UI primitives
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-dropdown-menu
```

---

## ⚙️ Step 3: Configuration Files

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        warning: {
          DEFAULT: "hsl(38, 92%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        info: {
          DEFAULT: "hsl(199, 89%, 48%)",
          foreground: "hsl(0, 0%, 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

### `.env` (Add your actual credentials)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### `.env.example`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 🎨 Step 4: Styles

### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 🔧 Step 5: Core Library Files

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### `src/lib/api.ts`

```typescript
import { supabase } from './supabase'
import type { Campaign, CampaignInsert } from '../types/campaign'
import type { ExecutionPhase } from '../types/phase'
import type { Recommendation } from '../types/recommendation'

// ============================================
// CAMPAIGNS
// ============================================

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Campaign[]
}

export async function getCampaignById(id: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Campaign
}

export async function createCampaign(campaign: CampaignInsert) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()
  
  if (error) throw error
  return data as Campaign
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Campaign
}

// ============================================
// EXECUTION PHASES
// ============================================

export async function getPhasesByCampaign(campaignId: string) {
  const { data, error } = await supabase
    .from('execution_phases')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('phase_number', { ascending: true })
  
  if (error) throw error
  return data as ExecutionPhase[]
}

export async function updatePhase(id: string, updates: Partial<ExecutionPhase>) {
  const { data, error } = await supabase
    .from('execution_phases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ExecutionPhase
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function getRecommendationsByCampaign(campaignId: string) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Recommendation[]
}

export async function updateRecommendation(id: string, updates: Partial<Recommendation>) {
  const { data, error } = await supabase
    .from('recommendations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Recommendation
}

// ============================================
// TEAM CAPACITY
// ============================================

export async function getTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      campaign_team_assignments(*)
    `)
  
  if (error) throw error
  return data
}
```

---

## 📝 Step 6: TypeScript Types

### `src/types/database.ts`

```typescript
import type { Campaign, CampaignInsert, CampaignUpdate } from './campaign'
import type { ExecutionPhase, ExecutionPhaseInsert, ExecutionPhaseUpdate } from './phase'
import type { DriftEvent, DriftEventInsert, DriftEventUpdate } from './phase'
import type { Recommendation, RecommendationInsert, RecommendationUpdate } from './recommendation'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign
        Insert: CampaignInsert
        Update: CampaignUpdate
      }
      execution_phases: {
        Row: ExecutionPhase
        Insert: ExecutionPhaseInsert
        Update: ExecutionPhaseUpdate
      }
      drift_events: {
        Row: DriftEvent
        Insert: DriftEventInsert
        Update: DriftEventUpdate
      }
      recommendations: {
        Row: Recommendation
        Insert: RecommendationInsert
        Update: RecommendationUpdate
      }
      // Add other tables as needed
    }
  }
}
```

### `src/types/campaign.ts`

```typescript
export type CampaignStatus = 'planning' | 'validated' | 'in_progress' | 'completed' | 'paused'

export type CampaignType = 
  | 'new_product_launch'
  | 'seasonal_promo'
  | 'brand_awareness'
  | 'lead_gen'
  | 'retargeting'
  | 'event_based'

export type PrimaryObjective = 
  | 'sales'
  | 'lead_gen'
  | 'brand_awareness'
  | 'engagement'
  | 'traffic'
  | 'app_installs'
  | 'store_visits'

export type PrimaryKPI = 
  | 'ROAS'
  | 'CPA'
  | 'CPL'
  | 'CTR'
  | 'engagement_rate'
  | 'reach'
  | 'video_views'

export interface TargetAudience {
  demographics?: {
    age_range?: string[]
    gender?: 'male' | 'female' | 'all'
    location_type?: string
    locations?: string[]
    income_level?: string
  }
  psychographics?: {
    interests?: string[]
    behaviors?: string[]
    life_events?: string[]
  }
}

export interface CreativeStrategy {
  format?: string[]
  theme?: string
  message?: string
  cta?: string
  testing_plan?: string[]
}

export interface Campaign {
  id: string
  created_at: string
  
  // Identity
  name: string
  campaign_type: CampaignType
  status: CampaignStatus
  
  // Timeline
  start_date: string
  end_date: string
  actual_launch_date?: string | null
  actual_completion_date?: string | null
  
  // Budget
  total_budget: number
  daily_budget?: number | null
  
  // Objectives
  primary_objective: PrimaryObjective
  primary_kpi: PrimaryKPI
  target_value: number
  secondary_kpis?: string[] | null
  
  // Audience
  target_audience?: TargetAudience | null
  audience_type?: string[] | null
  
  // Creative
  creative_strategy?: CreativeStrategy | null
  
  // Channel & Platform
  primary_platform?: string | null
  meta_placements?: any | null
  optimization_goal?: string | null
  
  // Bidding
  bidding_strategy?: string | null
  target_cpa?: number | null
  target_roas?: number | null
  
  // Benchmarks
  expected_ctr?: number | null
  expected_cpc?: number | null
  expected_conversion_rate?: number | null
  expected_cpa?: number | null
  
  // Tracking
  meta_pixel_id?: string | null
  meta_ads_account_id?: string | null
  conversion_events?: string[] | null
  utm_parameters?: string | null
  
  // Constraints & Context
  known_constraints?: any | null
  resource_constraints?: any | null
  historical_context?: any | null
  
  // Competitive Context
  market_saturation?: string | null
  competitive_advantage?: string | null
  seasonality_factor?: string | null
  
  // Pre-Launch Validation
  risk_score?: number | null
  gate_decision?: 'proceed' | 'adjust' | 'pause' | null
  gate_overridden?: boolean
  override_reason?: string | null
  override_at?: string | null
  
  // Health Indicators
  operational_health: number
  performance_health: number
  drift_count: number
  positive_drift_count: number
  negative_drift_count: number
  
  // Outcomes
  final_roas?: number | null
  final_cpa?: number | null
  final_conversions?: number | null
  total_spent?: number | null
  outcome_assessment?: string | null
  lessons_learned?: string | null
}

export type CampaignInsert = Omit<
  Campaign, 
  'id' | 'created_at' | 'operational_health' | 'performance_health' | 
  'drift_count' | 'positive_drift_count' | 'negative_drift_count'
>

export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'created_at'>>
```

### `src/types/phase.ts`

```typescript
export type PhaseType = 
  | 'planning'
  | 'creative'
  | 'compliance'
  | 'setup'
  | 'launch'
  | 'optimization'
  | 'reporting'

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type DriftType = 'positive' | 'negative' | 'neutral'

export interface ExecutionPhase {
  id: string
  campaign_id: string
  created_at: string
  
  // Phase Identity
  phase_number: number
  phase_name: string
  phase_type: PhaseType
  
  // Timeline
  planned_start_date: string
  planned_end_date: string
  planned_duration_days: number
  actual_start_date?: string | null
  actual_end_date?: string | null
  actual_duration_days?: number | null
  
  // Status
  status: PhaseStatus
  
  // Drift
  drift_days: number
  drift_type?: DriftType | null
  drift_reason?: string | null
  
  // Ownership
  owner?: string | null
  dependencies?: string[] | null
  blockers?: string[] | null
  
  // Details
  activities?: string[] | null
  deliverables?: string[] | null
  approvers?: string[] | null
  
  // Metadata
  metadata?: any | null
}

export interface DriftEvent {
  id: string
  campaign_id: string
  phase_id: string
  created_at: string
  
  drift_type: DriftType
  drift_days: number
  
  phase_name: string
  planned_duration: number
  actual_duration: number
  
  root_cause?: string | null
  attribution?: string | null
  
  impact_on_timeline?: string | null
  impact_on_budget?: number | null
  impact_on_performance?: string | null
  
  lesson_learned?: string | null
  actionable_insight?: string | null
  template_worthy: boolean
  
  evidence?: any | null
}

export type ExecutionPhaseInsert = Omit<ExecutionPhase, 'id' | 'created_at'>
export type ExecutionPhaseUpdate = Partial<Omit<ExecutionPhase, 'id' | 'created_at' | 'campaign_id'>>

export type DriftEventInsert = Omit<DriftEvent, 'id' | 'created_at'>
export type DriftEventUpdate = Partial<Omit<DriftEvent, 'id' | 'created_at' | 'campaign_id' | 'phase_id'>>
```

### `src/types/recommendation.ts`

```typescript
export type RecommendationTier = 'immediate' | 'tactical' | 'strategic'
export type RecommendationCategory = 'budget' | 'targeting' | 'creative' | 'timing' | 'bidding'
export type RecommendationStatus = 'suggested' | 'accepted' | 'rejected' | 'deferred' | 'completed'

export interface Recommendation {
  id: string
  campaign_id: string
  created_at: string
  
  // Recommendation Identity
  tier: RecommendationTier
  category: RecommendationCategory
  
  // Content
  title: string
  description: string
  reasoning: string
  
  // Implementation
  implementation_steps?: any | null
  estimated_effort?: string | null
  estimated_impact?: string | null
  time_to_implement?: string | null
  
  // Confidence & Evidence
  confidence_score?: number | null
  evidence?: any | null
  
  // Status Tracking
  status: RecommendationStatus
  accepted_at?: string | null
  completed_at?: string | null
  rejected_reason?: string | null
  
  // Outcome
  implementation_feedback?: string | null
  outcome_success?: boolean | null
  actual_impact?: string | null
  
  // AI Source
  ai_generated: boolean
  ai_model?: string | null
  ai_prompt_hash?: string | null
}

export type RecommendationInsert = Omit<Recommendation, 'id' | 'created_at'>
export type RecommendationUpdate = Partial<Omit<Recommendation, 'id' | 'created_at' | 'campaign_id'>>
```

### `src/types/team.ts`

```typescript
export interface TeamMember {
  id: string
  created_at: string
  
  name: string
  role: string
  email?: string | null
  
  max_campaigns: number
  current_campaigns: number
  utilization_percent: number
  
  available_from?: string | null
  available_until?: string | null
  weekly_hours: number
  
  skills?: string[] | null
  certifications?: string[] | null
  
  status: 'active' | 'on_leave' | 'overloaded'
  
  notes?: string | null
}

export interface CampaignTeamAssignment {
  id: string
  campaign_id: string
  team_member_id: string
  created_at: string
  
  role_in_campaign: string
  responsibilities?: string[] | null
  
  allocated_hours_per_week?: number | null
  start_date?: string | null
  end_date?: string | null
  
  status: 'active' | 'completed' | 'reassigned'
}
```

---

## 🛠️ Step 7: Utility Functions

### `src/utils/cn.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `src/utils/calculations.ts`

```typescript
export function calculateRiskScore(campaign: any): number {
  let score = 100
  
  // Budget risk (20 points)
  if (campaign.total_budget < 1000) score -= 20
  else if (campaign.total_budget < 5000) score -= 10
  
  // Timeline risk (15 points)
  const duration = new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()
  const durationDays = duration / (1000 * 60 * 60 * 24)
  if (durationDays < 7) score -= 15
  else if (durationDays < 14) score -= 10
  
  // Historical context risk (10 points)
  if (!campaign.historical_context?.similar_campaigns?.length) score -= 10
  
  // Constraint risks
  const constraints = campaign.known_constraints || []
  if (constraints.some((c: any) => c.type === 'compressed_timeline')) score -= 10
  if (constraints.some((c: any) => c.type === 'limited_budget')) score -= 5
  if (constraints.some((c: any) => c.type === 'first_campaign')) score -= 10
  
  return Math.max(0, Math.min(100, score))
}

export function calculateDriftDays(plannedDays: number, actualDays: number): number {
  return actualDays - plannedDays
}

export function getDriftType(driftDays: number): 'positive' | 'negative' | 'neutral' {
  if (driftDays < -1) return 'positive' // Finished early
  if (driftDays > 1) return 'negative' // Delayed
  return 'neutral'
}

export function getGateDecision(riskScore: number): 'proceed' | 'adjust' | 'pause' {
  if (riskScore >= 70) return 'proceed'
  if (riskScore >= 50) return 'adjust'
  return 'pause'
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 70) return 'low'
  if (score >= 50) return 'medium'
  if (score >= 30) return 'high'
  return 'critical'
}

export function calculateHealthScore(drift_count: number, positive_drift: number): number {
  const baseScore = 100
  const penalty = (drift_count - positive_drift) * 5
  const bonus = positive_drift * 2
  return Math.max(0, Math.min(100, baseScore - penalty + bonus))
}
```

### `src/utils/formatting.ts`

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateLong(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function getDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    planning: 'gray',
    validated: 'blue',
    in_progress: 'blue',
    completed: 'green',
    paused: 'yellow',
    pending: 'gray',
    blocked: 'red',
  }
  return colorMap[status] || 'gray'
}
```

---

## 🎣 Step 8: Custom Hooks

### `src/hooks/useCampaigns.ts`

```typescript
import { useState, useEffect } from 'react'
import { getCampaigns, getCampaignById } from '../lib/api'
import type { Campaign } from '../types/campaign'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      setLoading(true)
      const data = await getCampaigns()
      setCampaigns(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { campaigns, loading, error, refetch: loadCampaigns }
}

export function useCampaign(id: string | undefined) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    loadCampaign(id)
  }, [id])

  async function loadCampaign(campaignId: string) {
    try {
      setLoading(true)
      const data = await getCampaignById(campaignId)
      setCampaign(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { campaign, loading, error, refetch: () => id && loadCampaign(id) }
}
```

### `src/hooks/usePhases.ts`

```typescript
import { useState, useEffect } from 'react'
import { getPhasesByCampaign } from '../lib/api'
import type { ExecutionPhase } from '../types/phase'

export function usePhases(campaignId: string | undefined) {
  const [phases, setPhases] = useState<ExecutionPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setLoading(false)
      return
    }
    loadPhases(campaignId)
  }, [campaignId])

  async function loadPhases(id: string) {
    try {
      setLoading(true)
      const data = await getPhasesByCampaign(id)
      setPhases(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { phases, loading, error, refetch: () => campaignId && loadPhases(campaignId) }
}
```

### `src/hooks/useRecommendations.ts`

```typescript
import { useState, useEffect } from 'react'
import { getRecommendationsByCampaign } from '../lib/api'
import type { Recommendation } from '../types/recommendation'

export function useRecommendations(campaignId: string | undefined) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setLoading(false)
      return
    }
    loadRecommendations(campaignId)
  }, [campaignId])

  async function loadRecommendations(id: string) {
    try {
      setLoading(true)
      const data = await getRecommendationsByCampaign(id)
      setRecommendations(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { 
    recommendations, 
    loading, 
    error, 
    refetch: () => campaignId && loadRecommendations(campaignId) 
  }
}
```

---

## 🧩 Step 9: UI Components

### `src/components/ui/Button.tsx`

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
```

### `src/components/ui/Card.tsx`

```typescript
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### `src/components/ui/Badge.tsx`

```typescript
import { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'border-transparent bg-primary text-primary-foreground': variant === 'default',
          'border-transparent bg-success text-success-foreground': variant === 'success',
          'border-transparent bg-warning text-warning-foreground': variant === 'warning',
          'border-transparent bg-destructive text-destructive-foreground': variant === 'destructive',
          'border-transparent bg-info text-info-foreground': variant === 'info',
          'border-transparent bg-secondary text-secondary-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  )
}
```

### `src/components/ui/Input.tsx`

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

### `src/components/ui/Select.tsx`

```typescript
import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
```

---

## 📄 Step 10: Layout Components

### `src/components/layout/Navbar.tsx`

```typescript
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, PlusCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Navbar() {
  const location = useLocation()

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/team', label: 'Team Capacity', icon: Users },
    { to: '/campaigns/new', label: 'New Campaign', icon: PlusCircle },
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary">Campaign AI</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### `src/components/layout/PageLayout.tsx`

```typescript
import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
```

---

## 📱 Step 11: Pages

### `src/pages/Dashboard.tsx`

```typescript
import { Link } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useCampaigns } from '../hooks/useCampaigns'
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatting'
import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const { campaigns, loading, error } = useCampaigns()

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading campaigns...</div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading campaigns: {error.message}</p>
        </div>
      </PageLayout>
    )
  }

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'in_progress').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    needsAttention: campaigns.filter(c => c.risk_score && c.risk_score < 50).length,
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
            <p className="text-gray-500 mt-1">Monitor and manage all your campaigns</p>
          </div>
          <Link to="/campaigns/new">
            <Button>
              <span className="mr-2">+</span>
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Campaigns</CardDescription>
              <CardTitle className="text-4xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-4xl flex items-center">
                {stats.active}
                <TrendingUp className="w-5 h-5 text-blue-500 ml-2" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-4xl flex items-center">
                {stats.completed}
                <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Needs Attention</CardDescription>
              <CardTitle className="text-4xl flex items-center">
                {stats.needsAttention}
                {stats.needsAttention > 0 && (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 ml-2" />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-500 mb-4">No campaigns yet</p>
              <Link to="/campaigns/new">
                <Button>Create your first campaign</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={getStatusColor(campaign.status) as any}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">
                    {campaign.campaign_type.replace(/_/g, ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium">{formatCurrency(campaign.total_budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Timeline</span>
                      <span className="font-medium">
                        {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                      </span>
                    </div>
                    {campaign.risk_score !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Risk Score</span>
                        <span className={`font-medium ${
                          campaign.risk_score >= 70 ? 'text-green-600' :
                          campaign.risk_score >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {campaign.risk_score}/100
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link to={getRouteByCampaignStatus(campaign)}>
                        <Button variant="outline" className="w-full">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

function getRouteByCampaignStatus(campaign: any): string {
  if (campaign.status === 'planning') return `/campaigns/${campaign.id}/validate`
  if (campaign.status === 'in_progress') return `/campaigns/${campaign.id}/tracker`
  if (campaign.status === 'completed') return `/campaigns/${campaign.id}/analytics`
  return `/campaigns/${campaign.id}/tracker`
}
```

### `src/pages/CampaignCreate.tsx`

```typescript
import { PageLayout } from '../components/layout/PageLayout'

export default function CampaignCreate() {
  return (
    <PageLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>
        <p className="text-gray-500">Campaign creation form coming soon...</p>
      </div>
    </PageLayout>
  )
}
```

### `src/pages/CampaignValidate.tsx`

```typescript
import { useParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'

export default function CampaignValidate() {
  const { id } = useParams()
  
  return (
    <PageLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Campaign Validation</h1>
        <p className="text-gray-500">Validation page for campaign {id}</p>
      </div>
    </PageLayout>
  )
}
```

### `src/pages/ExecutionTracker.tsx`

```typescript
import { useParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'

export default function ExecutionTracker() {
  const { id } = useParams()
  
  return (
    <PageLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Execution Tracker</h1>
        <p className="text-gray-500">Tracker page for campaign {id}</p>
      </div>
    </PageLayout>
  )
}
```

### `src/pages/Analytics.tsx`

```typescript
import { useParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'

export default function Analytics() {
  const { id } = useParams()
  
  return (
    <PageLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Campaign Analytics</h1>
        <p className="text-gray-500">Analytics page for campaign {id}</p>
      </div>
    </PageLayout>
  )
}
```

### `src/pages/TeamCapacity.tsx`

```typescript
import { PageLayout } from '../components/layout/PageLayout'

export default function TeamCapacity() {
  return (
    <PageLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Team Capacity</h1>
        <p className="text-gray-500">Team capacity dashboard coming soon...</p>
      </div>
    </PageLayout>
  )
}
```

---

## 🚦 Step 12: Router & App Setup

### `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CampaignCreate from './pages/CampaignCreate'
import CampaignValidate from './pages/CampaignValidate'
import ExecutionTracker from './pages/ExecutionTracker'
import Analytics from './pages/Analytics'
import TeamCapacity from './pages/TeamCapacity'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns/new" element={<CampaignCreate />} />
        <Route path="/campaigns/:id/validate" element={<CampaignValidate />} />
        <Route path="/campaigns/:id/tracker" element={<ExecutionTracker />} />
        <Route path="/campaigns/:id/analytics" element={<Analytics />} />
        <Route path="/team" element={<TeamCapacity />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

### `src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## ✅ Step 13: Test the Setup

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:5173` and you should see:
- ✅ Navbar with navigation
- ✅ Dashboard with stats cards
- ✅ "No campaigns yet" message (if database is empty)
- ✅ All routes working

---

## 📋 Verification Checklist

After completing all steps, verify:

- [ ] Project runs without errors (`npm run dev`)
- [ ] Tailwind styles are working
- [ ] Navigation between pages works
- [ ] Supabase connection is established (check console for errors)
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] All imports resolve correctly

---

## 🎯 Next Steps

Once the structure is confirmed working:

1. **Add seed data** to Supabase (I can provide TypeScript seed functions)
2. **Build Campaign Create form** (comprehensive form from your plan)
3. **Build Execution Tracker** with phase timeline
4. **Add AI recommendations** system
5. **Implement risk scoring** and validation

---

## 📝 Notes

- All placeholder pages are ready for implementation
- Type definitions match your Supabase schema
- Utilities include all calculation functions needed
- Custom hooks handle data fetching with loading states
- UI components follow shadcn/ui patterns for consistency

**Total Setup Time:** ~45-60 minutes (including file creation and npm installs)