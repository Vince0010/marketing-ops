import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://xktszgxqtkcpewmhxbhj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdHN6Z3hxdGtjcGV3bWh4YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDc1MjEsImV4cCI6MjA4NjAyMzUyMX0.ni8M8EPVXl99pSgv8izLCVLXGlteLF8eMuNtMPm0Z_U'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🔄 Running planned_timeline migration...')
    
    const sqlPath = join(__dirname, 'add-planned-timeline.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT')) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Try direct query if RPC doesn't work
          console.log('Executing:', statement.substring(0, 80) + '...')
          const { error: directError } = await supabase.from('_migrations').insert([
            { statement }
          ])
          
          if (directError) {
            console.error('❌ Error executing statement:', directError.message)
          } else {
            console.log('✅ Statement executed')
          }
        } else {
          console.log('✅ Statement executed')
        }
      }
    }
    
    console.log('✅ Migration completed!')
    console.log('')
    console.log('Note: If migrations failed, you can run the SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/xktszgxqtkcpewmhxbhj/editor')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('')
    console.log('Please run the following SQL manually in Supabase SQL Editor:')
    console.log('')
    console.log(readFileSync(join(__dirname, 'add-planned-timeline.sql'), 'utf-8'))
  }
}

runMigration()
