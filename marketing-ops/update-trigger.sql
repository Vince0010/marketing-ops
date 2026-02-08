-- Update the trigger to preserve explicitly set time_in_phase_minutes
CREATE OR REPLACE FUNCTION update_time_in_phase()
RETURNS TRIGGER AS $$
BEGIN
    -- If started_at changed AND time_in_phase_minutes wasn't explicitly updated,
    -- reset time_in_phase_minutes to 0 (for simple phase moves).
    -- If time_in_phase_minutes WAS updated (different from old value), preserve it
    -- (for resume/carry-over scenarios).
    IF OLD.started_at IS DISTINCT FROM NEW.started_at AND 
       OLD.time_in_phase_minutes = NEW.time_in_phase_minutes THEN
        NEW.time_in_phase_minutes := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
