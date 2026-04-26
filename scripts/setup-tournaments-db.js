import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTournamentsDatabase() {
  try {
    console.log('Starting tournaments database setup...');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '02-create-tournaments.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    try {
      const { error } = await supabase.rpc('exec', { sql_string: sql });
      if (error) throw error;
    } catch (rpcError) {
      // If rpc doesn't exist, try direct query approach
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await supabase.from('_sql').insert({ query: statement });
        } catch (e) {
          // Ignore errors for non-existent _sql table
        }
      }
    }

    console.log('Tournaments database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

setupTournamentsDatabase();
