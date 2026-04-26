-- Create players table for individual formats
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL, -- 'knockout', 'liga', 'americano', 'mexicano'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ongoing', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_players table (for individuals in Americano/Mexicano)
CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Create tournament_teams table (for teams in Knockout/Liga)
CREATE TABLE IF NOT EXISTS tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- Alter matches to add tournament fields
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_number INT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_type VARCHAR(50) DEFAULT 'team'; -- 'team' or 'individual'

-- Add player columns to matches for Americano/Mexicano (when match_type = 'individual')
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_player1_id UUID REFERENCES players(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_player2_id UUID REFERENCES players(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_player1_id UUID REFERENCES players(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_player2_id UUID REFERENCES players(id) ON DELETE CASCADE;

-- Drop NOT NULL constraint on team1_id and team2_id since they might be null for individual matches
ALTER TABLE matches ALTER COLUMN team1_id DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN team2_id DROP NOT NULL;
