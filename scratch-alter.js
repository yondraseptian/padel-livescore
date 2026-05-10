const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { error } = await supabase.rpc('execute_sql', { sql_query: "ALTER TABLE tournaments ADD COLUMN gender_category VARCHAR(20) DEFAULT 'mixed';" });
  if (error) {
    console.log("RPC might not exist, using raw REST or just checking error:", error);
    // Let's create the column directly via a script if possible or we just ask the user to run it?
    // Wait, Supabase allows POST to /rest/v1/rpc or we can just use `psql` if it's local.
  } else {
    console.log("Column added");
  }
}

run();
