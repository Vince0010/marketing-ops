# Audience Insights Implementation

## Overview
The Audience Insights tab now displays actual campaign demographics data from the campaign creation form instead of hardcoded demo data.

## What Was Implemented

### 1. **Campaign Demographics Integration**
- Reads `target_audience.demographics.age_range` from campaign data
- Transforms targeting data into visual age distribution format
- Shows "No data" state when demographics weren't specified during creation

### 2. **Age Distribution Visualization**
The tab shows:
- **Goal (Target)**: Age ranges selected during campaign creation, evenly distributed
- **Actual**: Currently shows 0% (will be populated from Meta Ads API in future)
- **Diff**: Calculated difference (currently 0 since no actual data yet)

### Example:
If a campaign targets `['25-34', '35-44']` age groups:
- 25-34: goal 50%, actual 0%
- 35-44: goal 50%, actual 0%
- All others: goal 0%, actual 0%

### 3. **Dynamic Content**
The tab displays different content based on campaign data:

**When demographics exist:**
- Age distribution chart (target vs actual)
- Strong alignment: Shows which age groups are targeted
- Adjustment areas: Indicates no performance data yet
- Recommended actions: Guides to launch and monitor

**When no demographics:**
- Helpful message explaining demographics weren't specified
- Suggests editing campaign to add audience targeting

## Data Flow

```
Campaign Creation (TargetAudience.tsx)
    ↓
Store in campaigns.target_audience (JSONB)
    ↓
CampaignTracker.tsx reads target_audience
    ↓
transformCampaignDemographicsToAgeData() transforms to AgeRow[]
    ↓
DemographicAlignmentTracker displays visualization
```

## Current Behavior (Pre-Launch)

**All campaigns will show:**
- ✅ Correct age range targets from campaign creation
- ✅ Zero actual performance (expected before launch)
- ✅ Helpful guidance messages
- ✅ Fit score of 0 (will calculate once Meta Ads data arrives)

## Future Enhancements

To populate actual demographics data:

1. **Integrate Meta Ads API** (in MetaAdsDashboard)
   - Fetch audience breakdown from Meta Ads Insights API
   - Store in `meta_ads_performance` or new `audience_performance` table

2. **Calculate Actual Percentages**
   ```typescript
   // Future implementation
   const actualData = await fetchMetaAudienceDemographics(campaign.meta_ads_account_id)
   const ageData = allAgeRanges.map(range => ({
     range,
     goal: targetedRanges.includes(range) ? goalPercentPerRange : 0,
     actual: actualData[range] || 0, // From Meta API
     diff: (actualData[range] || 0) - (targetedRanges.includes(range) ? goalPercentPerRange : 0)
   }))
   ```

3. **Calculate Fit Score**
   - Average alignment across all targeted age ranges
   - Weight by budget allocation or impression volume
   - Score 0-100 based on how close actual matches target

4. **Generate Insights**
   - Strong alignment: Age ranges performing at/above target
   - Adjustment areas: Underperforming demographics
   - Recommended actions: Budget reallocation, creative testing

## Testing

To verify the implementation:

1. **View campaign with demographics:**
   ```bash
   # Navigate to any campaign in the tracker
   # Click "Audience Insights" tab
   # Should see targeted age ranges with 0% actual
   ```

2. **View campaign without demographics:**
   - Create a campaign, skip audience targeting
   - Should see "No target audience demographics specified" message

3. **Verify data accuracy:**
   - Campaign targeting ['18-24', '25-34', '35-44'] should show:
     - Each: goal ~33%, actual 0%
     - Others: goal 0%, actual 0%

## Related Files

- **[CampaignTracker.tsx](src/pages/CampaignTracker.tsx#L783-L820)** - Audience Insights tab implementation
- **[DemographicAlignmentTracker.tsx](src/components/demographics/DemographicAlignmentTracker.tsx)** - Visualization component
- **[TargetAudience.tsx](src/components/campaign-form/TargetAudience.tsx)** - Campaign creation form
- **[campaign.ts](src/types/campaign.ts#L95-L110)** - TargetAudience type definition

## Design Decisions

### Why show zeros instead of hiding the tab?
- **Visibility**: Users should see what they planned even before launch
- **Validation**: Confirms targeting was configured correctly
- **Expectation setting**: Clear that actual data comes post-launch
- **Educational**: Guides users on next steps (launch, monitor Meta Ads)

### Why evenly distribute goal percentages?
- Campaign creation doesn't ask for weighted targeting
- Even distribution is the simplest assumption
- Meta Ads API will show actual delivery distribution
- User can see if Meta's algorithm delivered differently than expected

### Why keep fit score at 0?
- Prevents misleading scores before data exists
- Clear indicator that calculation requires actual data
- Will become meaningful after 7+ days of campaign runtime
