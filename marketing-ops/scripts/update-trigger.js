import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xktszgxqtkcpewmhxbhj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdHN6Z3hxdGtjcGV3bWh4YmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ0NzUyMSwiZXhwIjoyMDg2MDIzNTIxfQ.Oz9xShJy9gJQsPd7rFNOh3ZPvp4GgO3A0R8ZmwOW6jw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const triggerFunction = `
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
`

async function updateTrigger() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: triggerFunction })
    
    if (error) {
      console.error('Error updating trigger:', error)
      // Try direct approach
      const { error: directError } = await supabase.from('_sql').select('*').limit(0)
      console.log('Using Supabase SQL editor instead...')
      console.log('\nPlease run this SQL in the Supabase SQL editor:')
      console.log(triggerFunction)
    } else {
      console.log('✅ Trigger updated successfully!')
    }
  } catch (err) {
    console.error('Error:', err)
    console.log('\n📝 Please run this SQL in the Supabase SQL editor:')
    console.log(triggerFunction)
  }
}

updateTrigger()
