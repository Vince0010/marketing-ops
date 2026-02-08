import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables:', {
        VITE_SUPABASE_URL: supabaseUrl ? '✓' : '✗',
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✓' : '✗'
    })
    throw new Error('Missing Supabase environment variables')
}

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

console.log('✅ Supabase Admin client initialized')
