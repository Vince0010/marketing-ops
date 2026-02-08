-- Example of how to manually verify or update planned_timeline data

-- 1. View action cards with their planned timelines
SELECT 
    id,
    title,
    phase_id,
    phase_name,
    planned_timeline,
    created_at
FROM marketer_actions
WHERE planned_timeline IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. View formatted planned timeline for a specific action card
SELECT 
    title,
    jsonb_pretty(planned_timeline) as formatted_timeline
FROM marketer_actions
WHERE id = 'YOUR_ACTION_CARD_ID';

-- 3. Check task phase history for an action card
SELECT 
    tph.id,
    tph.phase_name,
    tph.entered_at,
    tph.exited_at,
    tph.time_spent_minutes,
    CASE 
        WHEN tph.exited_at IS NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - tph.entered_at)) / 60
        ELSE 
            tph.time_spent_minutes
    END as total_minutes
FROM task_phase_history tph
WHERE tph.action_id = 'YOUR_ACTION_CARD_ID'
ORDER BY tph.entered_at;

-- 4. Get all phases for a campaign with their planned durations
SELECT 
    id,
    phase_number,
    phase_name,
    planned_duration_days,
    (planned_duration_days * 8 * 60) as planned_minutes
FROM execution_phases
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
ORDER BY phase_number;

-- 5. Manually set planned_timeline for an existing action card
-- (Use this if you need to backfill data for cards created before migration)
UPDATE marketer_actions
SET planned_timeline = jsonb_build_object(
    'phase-id-1', jsonb_build_object(
        'phase_name', 'Planning',
        'planned_minutes', 480,
        'phase_number', 1
    ),
    'phase-id-2', jsonb_build_object(
        'phase_name', 'Creative',
        'planned_minutes', 960,
        'phase_number', 2
    )
    -- Add more phases as needed
)
WHERE id = 'YOUR_ACTION_CARD_ID';

-- 6. Build planned_timeline from campaign phases (bulk update)
-- This query builds the planned_timeline map for all action cards in a campaign
WITH campaign_phases AS (
    SELECT 
        campaign_id,
        jsonb_object_agg(
            id::text,
            jsonb_build_object(
                'phase_name', phase_name,
                'planned_minutes', planned_duration_days * 8 * 60,
                'phase_number', phase_number
            )
        ) as timeline_map
    FROM execution_phases
    WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
    GROUP BY campaign_id
)
UPDATE marketer_actions ma
SET planned_timeline = cp.timeline_map
FROM campaign_phases cp
WHERE ma.campaign_id = cp.campaign_id
  AND ma.campaign_id = 'YOUR_CAMPAIGN_ID'
  AND ma.planned_timeline IS NULL;

-- 7. View drift analysis data (manual calculation)
WITH phase_times AS (
    SELECT 
        ma.id as action_id,
        ma.title,
        ma.campaign_id,
        pt.key as phase_id,
        pt.value->>'phase_name' as phase_name,
        (pt.value->>'planned_minutes')::integer as planned_minutes,
        COALESCE(SUM(tph.time_spent_minutes), 0) as actual_minutes
    FROM marketer_actions ma
    CROSS JOIN LATERAL jsonb_each(ma.planned_timeline) pt
    LEFT JOIN task_phase_history tph 
        ON tph.action_id = ma.id 
        AND tph.phase_id::text = pt.key
    WHERE ma.planned_timeline IS NOT NULL
    GROUP BY ma.id, ma.title, ma.campaign_id, pt.key, pt.value
)
SELECT 
    action_id,
    title,
    phase_name,
    planned_minutes,
    actual_minutes,
    (actual_minutes - planned_minutes) as drift_minutes,
    CASE 
        WHEN planned_minutes > 0 THEN
            ROUND(((actual_minutes - planned_minutes)::numeric / planned_minutes) * 100, 1)
        ELSE 0
    END as drift_percentage,
    CASE 
        WHEN planned_minutes = 0 THEN 'n/a'
        WHEN ((actual_minutes - planned_minutes)::numeric / planned_minutes) < -0.1 THEN 'ahead'
        WHEN ((actual_minutes - planned_minutes)::numeric / planned_minutes) > 0.1 THEN 'behind'
        ELSE 'on_track'
    END as status
FROM phase_times
ORDER BY action_id, phase_name;

-- 8. Summary statistics per action card
WITH phase_times AS (
    SELECT 
        ma.id as action_id,
        ma.title,
        ma.metadata->>'platform' as platform,
        ma.metadata->>'post_type' as post_type,
        SUM((pt.value->>'planned_minutes')::integer) as total_planned,
        COALESCE(SUM(tph.time_spent_minutes), 0) as total_actual
    FROM marketer_actions ma
    CROSS JOIN LATERAL jsonb_each(ma.planned_timeline) pt
    LEFT JOIN task_phase_history tph 
        ON tph.action_id = ma.id 
        AND tph.phase_id::text = pt.key
    WHERE ma.planned_timeline IS NOT NULL
    GROUP BY ma.id, ma.title, ma.metadata
)
SELECT 
    title,
    platform,
    post_type,
    total_planned,
    total_actual,
    (total_actual - total_planned) as drift_minutes,
    CASE 
        WHEN total_planned > 0 THEN
            ROUND(((total_actual - total_planned)::numeric / total_planned) * 100, 1)
        ELSE 0
    END as drift_percentage,
    CASE 
        WHEN total_planned = 0 THEN 'n/a'
        WHEN ((total_actual - total_planned)::numeric / total_planned) < -0.1 THEN 'ahead'
        WHEN ((total_actual - total_planned)::numeric / total_planned) > 0.1 THEN 'behind'
        ELSE 'on_track'
    END as status
FROM phase_times
ORDER BY drift_percentage DESC;

-- 9. Find action cards with no planned timeline
SELECT 
    id,
    title,
    campaign_id,
    created_at
FROM marketer_actions
WHERE planned_timeline IS NULL
ORDER BY created_at DESC;

-- 10. Verify planned_timeline structure
-- Should return records where all phases have required fields
SELECT 
    ma.id,
    ma.title,
    COUNT(pt.*) as phase_count,
    BOOL_AND(pt.value ? 'phase_name') as has_phase_name,
    BOOL_AND(pt.value ? 'planned_minutes') as has_planned_minutes,
    BOOL_AND(pt.value ? 'phase_number') as has_phase_number
FROM marketer_actions ma
CROSS JOIN LATERAL jsonb_each(ma.planned_timeline) pt
WHERE ma.planned_timeline IS NOT NULL
GROUP BY ma.id, ma.title
HAVING NOT (
    BOOL_AND(pt.value ? 'phase_name') AND
    BOOL_AND(pt.value ? 'planned_minutes') AND
    BOOL_AND(pt.value ? 'phase_number')
);
