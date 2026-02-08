# Accountability Tracking Implementation

## Overview

The Accountability tab provides comprehensive stakeholder action tracking, delay attribution, and accountability mapping. This implements **Agency Need #1: Accountability Mapping** from the design documents, allowing teams to track who is responsible for delays and whether they are client-side, agency-side, or external.

## Features Implemented

### 1. **Stakeholder Action Tracking**
- **Log Actions**: Track approvals, reviews, deliverables, feedback, decisions, and sign-offs
- **Stakeholder Types**: Client, Agency, External (legal, vendors, etc.)
- **Critical Path Indicators**: Mark actions that block campaign progress
- **Status Tracking**: Pending, In Progress, Completed, Overdue, Blocked

### 2. **Delay Attribution**
- **Client Delays**: Actions delayed by client stakeholders
- **Agency Delays**: Actions delayed by agency team
- **External Delays**: Actions delayed by third parties (legal, vendors)
- **Force Majeure**: Delays outside anyone's control
- **Automatic Calculation**: System calculates overdue days based on expected vs actual dates

### 3. **Accountability Summary Metrics**
- **Total Actions**: Count of all stakeholder actions logged
- **Completed**: Successfully completed actions
- **Overdue**: Actions past their expected date
- **On-Time %**: Percentage of actions completed on time
- **Delay Breakdown**: Visual breakdown of delays by attribution with percentages
- **Average Delay**: Mean delay days across all overdue actions
- **Critical Path Delays**: Count of delayed critical path items

### 4. **Action Timeline Display**
- **Color-Coded Badges**: Visual distinction between client, agency, and external stakeholders
- **Date Tracking**: Requested, expected, and actual completion dates
- **Delay Reasons**: Capture why actions were delayed
- **Impact Assessment**: Document how delays affected campaign timeline
- **Notes**: Additional context for each action

### 5. **Data Entry & Management**
- **Add Action Dialog**: Comprehensive form to log new stakeholder actions
- **Mark Complete**: One-click action completion with timestamp
- **Update Actions**: Edit existing actions (via service layer)
- **Auto-refresh**: Actions reload after create/update operations

## Architecture

### Service Layer (`accountabilityService.ts`)

**Core Functions:**
- `fetchStakeholderActions(campaignId)` - Retrieve all actions for campaign
- `createStakeholderAction(data)` - Insert new action record
- `updateStakeholderAction(id, data)` - Update existing action
- `completeStakeholderAction(id)` - Mark action complete with timestamp
- `calculateAccountabilitySummary(actions)` - Generate summary metrics
- `getDelayBreakdown(actions)` - Calculate delay attribution percentages
- `groupActionsByPhase(actions)` - Organize actions by execution phase
- `calculateOverdueDays(action)` - Compute delay days

**Key Types:**
```typescript
interface AccountabilitySummary {
  total_actions: number
  completed: number
  overdue: number
  client_delays: number
  agency_delays: number
  external_delays: number
  avg_delay_days: number
  critical_path_delays: number
  on_time_percentage: number
}

interface DelayBreakdown {
  attribution: string
  count: number
  total_days: number
  percentage: number
}
```

### UI Component (`AccountabilityTimeline.tsx`)

**Component Props:**
```typescript
interface AccountabilityTimelineProps {
  campaignId: string
  actions: StakeholderAction[]
  onActionCreated?: () => void
  onActionCompleted?: () => void
}
```

**Key Sections:**
1. **Summary Cards**: 4-card grid showing key metrics
2. **Delay Attribution**: Visual breakdown with progress bars
3. **Actions Timeline**: Detailed list of all stakeholder actions
4. **Add Action Dialog**: Form for logging new actions

### Integration (`CampaignTracker.tsx`)

**State Management:**
```typescript
const [stakeholderActions, setStakeholderActions] = useState<StakeholderAction[]>([])
const [loadingActions, setLoadingActions] = useState(true)
```

**Data Fetching:**
```typescript
const fetchActions = useCallback(async () => {
  const { data, error } = await fetchStakeholderActions(id)
  if (!error) setStakeholderActions(data || [])
}, [id])

useEffect(() => {
  fetchActions()
}, [fetchActions])
```

**Render:**
```typescript
<AccountabilityTimeline
  campaignId={id!}
  actions={stakeholderActions}
  onActionCreated={fetchActions}
  onActionCompleted={fetchActions}
/>
```

## Database Schema

**Table: `stakeholder_actions`**
```sql
CREATE TABLE stakeholder_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES execution_phases(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approval', 'review', 'delivery', 'feedback', 'decision', 'sign_off')),
  action_description TEXT NOT NULL,
  stakeholder_name TEXT NOT NULL,
  stakeholder_role TEXT,
  stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('client', 'agency', 'external')),
  requested_date TIMESTAMPTZ NOT NULL,
  expected_date TIMESTAMPTZ,
  actual_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'blocked')),
  overdue_days INTEGER,
  critical_path BOOLEAN DEFAULT FALSE,
  delay_reason TEXT,
  delay_attribution TEXT CHECK (delay_attribution IN ('client', 'agency', 'external', 'force_majeure')),
  delay_impact TEXT,
  notes TEXT,
  logged_by TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_stakeholder_actions_campaign_id` - Fast campaign lookups
- `idx_stakeholder_actions_status` - Filter by status
- `idx_stakeholder_actions_stakeholder_type` - Group by stakeholder type

## Usage Guide

### Logging a Stakeholder Action

1. Navigate to campaign tracker
2. Click **Accountability** tab
3. Click **Log Action** button
4. Fill in action details:
   - **Action Type**: Approval, Review, Delivery, etc.
   - **Stakeholder Type**: Client, Agency, or External
   - **Action Description**: What needs to be done (e.g., "Approve final creative concepts")
   - **Stakeholder Name & Role**: Who is responsible
   - **Dates**: When requested and when expected
   - **Critical Path**: Check if action blocks campaign progress
   - **Notes**: Additional context
5. Click **Log Action**

### Marking Actions Complete

1. Find action in timeline
2. Click **Mark Complete** button
3. System auto-records completion date and calculates delay (if any)

### Reviewing Accountability

**Summary Metrics** show at a glance:
- Total actions and completion rate
- How many actions are overdue
- On-time completion percentage

**Delay Attribution** shows:
- Percentage breakdown of who caused delays
- Total delay days per attribution type
- Average delay across all actions
- Count of critical path delays

**Timeline** shows:
- All actions in chronological order
- Color-coded by stakeholder type
- Overdue indicators and delay days
- Delay reasons and impact statements

## Client-Facing Reporting

The accountability system provides transparent, objective data for client reports:

### Delay Attribution Reports
- **Client Delays**: "3 delays totaling 8 days (60% of total delays)"
- **Agency Delays**: "1 delay totaling 2 days (15% of total delays)"
- **External Delays**: "2 delays totaling 3 days (25% of total delays)"

### On-Time Performance
- "85% of stakeholder actions completed on time"
- "Average delay: 2.5 days across overdue items"
- "2 critical path delays affecting launch timeline"

### Visual Accountability
- Progress bars showing delay distribution
- Color-coded stakeholder badges
- Clear attribution for every delay

## Design Principles

### 1. **Objective Tracking**
- System tracks dates, not opinions
- Auto-calculates overdue days
- No subjective blame assignment

### 2. **Transparency**
- Client can see their own delays
- Agency delays are equally visible
- External factors are tracked separately

### 3. **Actionable Insights**
- Critical path indicators highlight blockers
- Impact statements show consequences
- Delay reasons enable process improvement

### 4. **Fair Attribution**
- "Force majeure" option for uncontrollable delays
- Clear stakeholder type categories
- Documented reasons for every delay

## Future Enhancements

### Planned Features
1. **Phase Linking**: Associate actions with specific execution phases
2. **Automated Reminders**: Send alerts before expected dates
3. **Approval Workflows**: Multi-step approval processes
4. **Historical Trends**: Track accountability over multiple campaigns
5. **PDF Reports**: Export accountability reports for clients
6. **SLA Tracking**: Monitor against service level agreements
7. **Stakeholder Dashboards**: Personalized views for each stakeholder

### Potential Integrations
- Email notifications for overdue actions
- Slack/Teams integration for status updates
- Calendar integration for deadline tracking
- Document attachment support for approvals

## Key Benefits

### For Agencies
- **Objective evidence** of who caused delays
- **Reduced finger-pointing** with data-driven accountability
- **Client transparency** builds trust
- **Process insights** for future campaigns
- **Billing justification** for delayed launches

### For Clients
- **Visibility** into their own approval delays
- **Understanding** of timeline impacts
- **Trust** in agency reporting
- **Process improvement** opportunities
- **Realistic expectations** for future campaigns

### For Teams
- **Clear ownership** of action items
- **Priority visibility** with critical path indicators
- **Progress tracking** toward launch
- **Bottleneck identification** in real-time
- **Celebration** of on-time completions

## Testing

### Manual Test Cases

1. **Create Action**: Log a client approval, verify it appears in timeline
2. **Mark Complete On-Time**: Complete action before expected date, verify 0 delay
3. **Mark Complete Late**: Complete action after expected date, verify overdue days calculated
4. **Critical Path**: Log critical action, verify indicator appears
5. **Delay Attribution**: Add delay reason and attribution, verify in breakdown
6. **Summary Metrics**: Log multiple actions, verify counts and percentages
7. **Empty State**: View tab with no actions, verify helpful message
8. **Loading State**: Verify spinner during data fetch

### Validation Checks

- ✅ Actions load from database
- ✅ Summary metrics calculate correctly
- ✅ Delay breakdown shows percentages
- ✅ Overdue days auto-calculate
- ✅ Critical path badges appear
- ✅ Color coding works for stakeholder types
- ✅ Date formatting displays correctly
- ✅ Create action form validates required fields
- ✅ Mark complete updates status and date
- ✅ On-time percentage calculates accurately

## Technical Notes

### Performance Considerations
- Actions fetched once on mount, then cached
- Summary/breakdown calculations done client-side
- Minimal database queries (single fetch per campaign)
- Optimistic UI updates for mark complete

### Type Safety
- Full TypeScript coverage
- Database types from `database.ts`
- Service layer returns typed data
- Component props strictly typed

### Error Handling
- Database errors logged to console
- User-friendly error messages
- Graceful degradation if fetch fails
- Loading states prevent UI flickering

### Accessibility
- Color + text for stakeholder types (not color alone)
- Keyboard navigation in dialogs
- ARIA labels on interactive elements
- Screen reader friendly date formats

---

**Status**: ✅ Fully Implemented
**Last Updated**: 2026-01-31
**Related Docs**: `high_level_design.md`, `sprint_workflow.md`
