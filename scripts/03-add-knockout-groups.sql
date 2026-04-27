-- Migration: Add knockout_setting and group_name columns
-- Run this in your Supabase SQL Editor

-- 1. Add knockout_setting to tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS knockout_setting INT;

-- 2. Add group_name to tournament_players
ALTER TABLE tournament_players 
ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);

-- 3. (Optional) Refresh PostgREST cache (usually happens automatically)
-- NOTIFY pgrst, 'reload schema';
