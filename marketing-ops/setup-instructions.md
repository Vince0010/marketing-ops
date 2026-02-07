# Campaign AI - TypeScript Setup Instructions

## Step 1: Initialize Project

```bash
# Create Vite project with React + TypeScript
npm create vite@latest campaign-ai -- --template react-ts
cd campaign-ai

# Install dependencies
npm install

# Install core libraries
npm install react-router-dom recharts lucide-react date-fns
npm install @supabase/supabase-js

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui dependencies (optional but recommended)
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs
```

## Step 2: Configure Tailwind

**File: `tailwind.config.js`**
```js
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

**File: `src/index.css`**
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

## Step 3: Environment Variables

**File: `.env`**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**File: `.env.example`**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Step 4: Create Project Structure

Run these commands in your terminal from the `src/` directory:

```bash
# Navigate to src
cd src

# Create main directories
mkdir -p components/{ui,campaigns,phases,recommendations,team,analytics}
mkdir -p pages
mkdir -p lib
mkdir -p types
mkdir -p hooks
mkdir -p utils

# Return to project root
cd ..
```

Or manually create this structure:

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (buttons, cards, etc.)
│   ├── campaigns/          # Campaign-specific components
│   ├── phases/             # Execution phase components
│   ├── recommendations/    # Recommendation system components
│   ├── team/               # Team capacity components
│   └── analytics/          # Charts and visualizations
├── pages/
│   ├── Dashboard.tsx
│   ├── CampaignCreate.tsx
│   ├── CampaignValidate.tsx
│   ├── ExecutionTracker.tsx
│   ├── Analytics.tsx
│   └── TeamCapacity.tsx
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── api.ts             # API functions
├── types/
│   ├── campaign.ts        # Campaign type definitions
│   ├── phase.ts           # Phase type definitions
│   └── database.ts        # Database types
├── hooks/
│   ├── useCampaigns.ts
│   ├── usePhases.ts
│   └── useRecommendations.ts
├── utils/
│   ├── cn.ts              # Class name utility
│   ├── calculations.ts    # Risk scoring, drift calculations
│   └── formatting.ts      # Date, currency formatting
├── App.tsx
├── main.tsx
└── index.css
```

## Step 5: Create Core Files

### 5.1 Supabase Client

**File: `src/lib/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 5.2 TypeScript Types

**File: `src/types/database.ts`**
```typescript
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
      // Add other tables as needed
    }
  }
}

// These will be expanded in campaign.ts
export type Campaign = any
export type CampaignInsert = any
export type CampaignUpdate = any
export type ExecutionPhase = any
export type ExecutionPhaseInsert = any
export type ExecutionPhaseUpdate = any
export type DriftEvent = any
export type DriftEventInsert = any
export type DriftEventUpdate = any
```

**File: `src/types/campaign.ts`**
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
  actual_launch_date?: string
  actual_completion_date?: string
  
  // Budget
  total_budget: number
  daily_budget?: number
  
  // Objectives
  primary_objective: PrimaryObjective
  primary_kpi: PrimaryKPI
  target_value: number
  secondary_kpis?: string[]
  
  // Audience
  target_audience?: TargetAudience
  audience_type?: string[]
  
  // Creative
  creative_strategy?: CreativeStrategy
  
  // Tracking
  meta_pixel_id?: string
  meta_ads_account_id?: string
  
  // Risk & Validation
  risk_score?: number
  gate_decision?: 'proceed' | 'adjust' | 'pause'
  gate_overridden?: boolean
  override_reason?: string
  
  // Health
  operational_health: number
  performance_health: number
  drift_count: number
  positive_drift_count: number
  negative_drift_count: number
}

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

export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'operational_health' | 'performance_health' | 'drift_count' | 'positive_drift_count' | 'negative_drift_count'>
```

**File: `src/types/phase.ts`**
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
  actual_start_date?: string
  actual_end_date?: string
  actual_duration_days?: number
  
  // Status
  status: PhaseStatus
  
  // Drift
  drift_days: number
  drift_type?: DriftType
  drift_reason?: string
  
  // Ownership
  owner?: string
  dependencies?: string[]
  blockers?: string[]
  
  // Details
  activities?: string[]
  deliverables?: string[]
  approvers?: string[]
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
  
  root_cause?: string
  attribution?: string
  
  impact_on_timeline?: string
  lesson_learned?: string
  actionable_insight?: string
  template_worthy: boolean
}
```

### 5.3 Utilities

**File: `src/utils/cn.ts`**
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**File: `src/utils/calculations.ts`**
```typescript
export function calculateRiskScore(campaign: any): number {
  // Simplified risk calculation for hackathon
  let score = 100
  
  // Budget risk
  if (campaign.total_budget < 1000) score -= 20
  
  // Timeline risk
  const duration = new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()
  const durationDays = duration / (1000 * 60 * 60 * 24)
  if (durationDays < 14) score -= 15
  
  // First campaign risk
  if (!campaign.historical_context?.similar_campaigns?.length) score -= 10
  
  return Math.max(0, Math.min(100, score))
}

export function calculateDriftDays(plannedDays: number, actualDays: number): number {
  return actualDays - plannedDays
}

export function getDriftType(driftDays: number): 'positive' | 'negative' | 'neutral' {
  if (driftDays < -1) return 'positive'
  if (driftDays > 1) return 'negative'
  return 'neutral'
}

export function getGateDecision(riskScore: number): 'proceed' | 'adjust' | 'pause' {
  if (riskScore >= 70) return 'proceed'
  if (riskScore >= 50) return 'adjust'
  return 'pause'
}
```

**File: `src/utils/formatting.ts`**
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

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
```

### 5.4 Router Setup

**File: `src/App.tsx`**
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

### 5.5 Basic Page Scaffolds

**File: `src/pages/Dashboard.tsx`**
```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Campaign } from '../types/campaign'

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Dashboard</h1>
          <Link 
            to="/campaigns/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <Link 
              to="/campaigns/new"
              className="text-blue-600 hover:text-blue-700"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{campaign.campaign_type}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded ${
                    campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                  <Link 
                    to={`/campaigns/${campaign.id}/tracker`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Create placeholder files for other pages:**

**File: `src/pages/CampaignCreate.tsx`**
```typescript
export default function CampaignCreate() {
  return <div className="p-8">Campaign Create - Coming Soon</div>
}
```

**File: `src/pages/CampaignValidate.tsx`**
```typescript
export default function CampaignValidate() {
  return <div className="p-8">Campaign Validate - Coming Soon</div>
}
```

**File: `src/pages/ExecutionTracker.tsx`**
```typescript
export default function ExecutionTracker() {
  return <div className="p-8">Execution Tracker - Coming Soon</div>
}
```

**File: `src/pages/Analytics.tsx`**
```typescript
export default function Analytics() {
  return <div className="p-8">Analytics - Coming Soon</div>
}
```

**File: `src/pages/TeamCapacity.tsx`**
```typescript
export default function TeamCapacity() {
  return <div className="p-8">Team Capacity - Coming Soon</div>
}
```

### 5.6 Update Main Entry

**File: `src/main.tsx`**
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

## Step 6: Test Setup

```bash
# Start dev server
npm run dev
```

Visit `http://localhost:5173` - you should see the Dashboard with "No campaigns yet"

## Next Steps

Once this is running:
1. ✅ Test Supabase connection (Dashboard should load without errors)
2. ✅ Seed demo data through Supabase Studio or SQL
3. ✅ Build out Campaign Create form
4. ✅ Build Execution Tracker
5. ✅ Add AI recommendations

## Troubleshooting

**If you get Supabase errors:**
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check browser console for specific errors

**If Tailwind styles don't work:**
- Make sure `index.css` is imported in `main.tsx`
- Verify `tailwind.config.js` content paths are correct
- Restart dev server after config changes

**TypeScript errors:**
- Run `npm run build` to see all type errors
- Update type definitions in `src/types/` as needed

## File Checklist

After setup, you should have:
- ✅ `tailwind.config.js`
- ✅ `src/index.css`
- ✅ `.env` (with your Supabase credentials)
- ✅ `src/lib/supabase.ts`
- ✅ `src/types/database.ts`
- ✅ `src/types/campaign.ts`
- ✅ `src/types/phase.ts`
- ✅ `src/utils/cn.ts`
- ✅ `src/utils/calculations.ts`
- ✅ `src/utils/formatting.ts`
- ✅ `src/App.tsx`
- ✅ `src/pages/Dashboard.tsx`
- ✅ All placeholder pages
- ✅ `src/main.tsx`

Total setup time: ~20-30 minutes