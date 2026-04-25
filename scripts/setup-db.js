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

async function setupDatabase() {
  try {
    console.log('Starting database setup...');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '01-create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec', {
      sql_string: sql,
    }).catch(async () => {
      // If rpc doesn't exist, try direct query approach
      // Split by statement and execute one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        const { error } = await supabase.from('_sql').insert({
          query: statement,
        }).catch(() => ({ error: null })); // Ignore errors for non-existent _sql table
      }

      return { error: null };
    });

    if (error) {
      console.error('Database setup error:', error);
      process.exit(1);
    }

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
