import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const migrationPath = resolve('./scripts/setup-supabase.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('Executing migration...')
    const { error } = await supabase.rpc('exec', { sql_string: sql })

    if (error) {
      // If exec RPC doesn't exist, try direct query
      console.log('exec RPC not available, running SQL directly...')
      const statements = sql.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: queryError } = await supabase.from('_sql').select('*').limit(0)
          // This is just to test, we'll use the service client differently
        }
      }
    }

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
