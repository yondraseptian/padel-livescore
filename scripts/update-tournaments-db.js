import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sqlPath = path.join(__dirname, '03-update-tournaments.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing 03-update-tournaments.sql...');
  
  try {
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec', { sql_string: statement });
      if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.warn('exec_sql RPC not found. Fallback: manual execution needed or handle via migrations.');
        } else {
          console.error('Error executing statement:', error);
        }
      }
    }
    console.log('Update finished! Please check Supabase if exec_sql was not available.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();
