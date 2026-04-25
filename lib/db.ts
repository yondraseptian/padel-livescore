import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

// Client for browser (read-only)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey || '');

// Server client with service role (read-write)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey || '');

// Types for database schema
export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
}

export interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed';
  winner_id?: string;
  created_at: string;
  updated_at: string;
  team1?: Team;
  team2?: Team;
}

export interface MatchScore {
  id: string;
  match_id: string;
  set_number: number;
  game_number: number;
  team1_points: number;
  team2_points: number;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  team_id: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  games_won: number;
  games_lost: number;
  sets_won: number;
  sets_lost: number;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}
