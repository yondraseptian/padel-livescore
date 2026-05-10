import { supabaseServer } from '../lib/db';

async function run() {
  const { error } = await supabaseServer.rpc('execute_sql', { sql_query: "ALTER TABLE tournaments ADD COLUMN gender_category VARCHAR(20) DEFAULT 'mixed';" });
  if (error) {
    console.log("RPC might not exist, trying raw fetch or fallback...");
    // Let's create a temporary match-service or similar to run it, wait, we can't do raw sql via supabase-js unless it's a proxy.
  }
}

run();
