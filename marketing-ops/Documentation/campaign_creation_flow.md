# Campaign Creation Flow — Architecture & Components

## Overview

The campaign creation form is a comprehensive 10-section accordion layout that captures all campaign configuration data. It includes a customizable execution stage builder that allows agencies to define, rename, reorder, add, and remove execution stages.

---

## Form Sections

| # | Section | Component | Required |
|---|---------|-----------|----------|
| 1 | Campaign Fundamentals | `CampaignFundamentals.tsx` | Yes |
| 2 | Objectives & KPIs | `ObjectivesKPIs.tsx` | Yes |
| 3 | Target Audience | `TargetAudience.tsx` | No |
| 4 | Creative Strategy | `CreativeStrategy.tsx` | No |
| 5 | Channel & Placement | `ChannelPlacement.tsx` | No |
| 6 | Budget Strategy | `BudgetStrategy.tsx` | No |
| 7 | Execution Stages | `StageBuilder.tsx` | Yes |
| 8 | Constraints & Risk Factors | `ConstraintsRisks.tsx` | No |
| 9 | Tracking & Measurement | `TrackingSetup.tsx` | No |
| 10 | Competitive & Market Context | `CompetitiveContext.tsx` | No |

---

## File Structure

```
src/
├── components/
│   ├── campaign-form/
│   │   ├── CampaignFundamentals.tsx    # Name, type, dates, budget, industry
│   │   ├── ObjectivesKPIs.tsx          # Objective, KPI, target value
│   │   ├── TargetAudience.tsx          # Demographics, psychographics, audience type
│   │   ├── CreativeStrategy.tsx        # Format, theme, message, CTA, testing plan
│   │   ├── ChannelPlacement.tsx        # Facebook/Instagram placements, optimization goal
│   │   ├── BudgetStrategy.tsx          # Daily/lifetime budget, bidding, benchmarks
│   │   ├── ConstraintsRisks.tsx        # Known/resource constraints, historical data
│   │   ├── TrackingSetup.tsx           # Meta Pixel, conversion events, external tracking
│   │   └── CompetitiveContext.tsx      # Market saturation, competitors, seasonality
│   └── stages/
│       ├── StageBuilder.tsx            # Container: manages stage array state
│       ├── StageList.tsx               # Sortable list with reorder/edit/delete
│       └── StageEditor.tsx             # Dialog for editing stage details
├── lib/
│   ├── defaultStages.ts               # Factory for 7 default stage configs
│   └── stageUtils.ts                  # Stage-to-ExecutionPhaseInsert converter
├── types/
│   ├── campaign.ts                    # Campaign, TargetAudience, BudgetStrategy, etc.
│   ├── phase.ts                       # StageConfig, ExecutionPhase, PhaseType, etc.
│   └── database.ts                    # Supabase Database type definitions
└── pages/
    └── CampaignCreate.tsx             # Main form page integrating all sections
```

---

## Customizable Execution Stages

### How It Works

1. **Default Stages**: When creating a campaign, 7 default stages are loaded:
   - Planning (5 days), Creative Development (7 days), Compliance & Approval (3 days), Technical Setup (2 days), Launch (1 day), Optimization (14 days), Reporting (3 days)

2. **Customization**: Agencies can:
   - **Rename** any stage
   - **Reorder** stages using up/down arrows
   - **Add** new custom stages
   - **Remove** existing stages (minimum 1 required)
   - **Configure** each stage's duration, owner, activities, deliverables, approvers, and dependencies

3. **Custom Types**: The `PhaseType` supports both default types (`planning`, `creative`, etc.) and any custom string, preserving IDE autocomplete.

### Data Flow

```
createDefaultStages() → StageConfig[] → StageBuilder (editable UI)
                                              ↓ on form submit
stagesToPhaseInserts(stages, campaignId, startDate) → ExecutionPhaseInsert[]
                                              ↓
                                   Supabase execution_phases table
```

### Key Types

**StageConfig** (working state in the builder):
- `tempId`: UUID for React keys and dependency references
- `phase_number`: Order position (auto-renumbered on reorder/delete)
- `phase_name`: Display name (free text)
- `phase_type`: Category (default or custom)
- `planned_duration_days`: Duration in days
- `owner`, `activities`, `deliverables`, `approvers`, `dependencies`

**ExecutionPhaseInsert** (saved to DB):
- Same fields as ExecutionPhase minus auto-generated ones (id, created_at, actual dates, drift)
- `planned_start_date` and `planned_end_date` are computed sequentially from campaign start date

---

## Form Submission Flow

1. User fills out required fields (name, type, dates, budget, objective, KPI, target value)
2. User customizes execution stages (or keeps defaults)
3. On submit:
   - Campaign row inserted into `campaigns` table
   - Stages converted to `execution_phases` rows via `stagesToPhaseInserts()`
   - Phases batch-inserted into `execution_phases` table
4. User navigated to `/campaigns/:id/validate` for pre-launch risk assessment

---

## Component Props Pattern

Each form section follows a consistent pattern:

```typescript
interface Props {
  data: SectionDataType
  onChange: (updates: Partial<SectionDataType>) => void
}
```

The parent `CampaignCreate` page owns all form state and passes down data + onChange handlers to each section.

---

## Campaign Data Model

The `Campaign` interface stores nested JSON data for complex sections:

| Field | Type | Storage |
|-------|------|---------|
| `target_audience` | `TargetAudience` | JSONB |
| `creative_strategy` | `CreativeStrategy` | JSONB |
| `channel_placement` | `ChannelPlacement` | JSONB |
| `budget_strategy` | `BudgetStrategy` | JSONB |
| `tracking_setup` | `TrackingSetup` | JSONB |
| `competitive_context` | `CompetitiveContext` | JSONB |
| `constraints` | `Constraints` | JSONB |

This avoids creating separate relational tables for each section.
