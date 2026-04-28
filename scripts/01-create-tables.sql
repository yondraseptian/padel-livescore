-- MASTER SCHEMA FOR PADEL LIVESCORE APP
-- This script consolidates all migrations and removes unused tables like tournament_teams.

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS match_scores CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS tournament_players CASCADE;
DROP TABLE IF EXISTS tournament_teams CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- 1. Create teams table (for standard 2v2 team-based matches)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create players table (for Americano/Mexicano and tournament participants)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  format VARCHAR(100) NOT NULL, -- Americano, Mexicano, Knockout, Group Stage, etc.
  status VARCHAR(50) DEFAULT 'draft', -- draft, ongoing, completed
  game_type VARCHAR(50) DEFAULT 'tournament', -- tournament or mabar
  tournament_date DATE,
  number_of_courts INT DEFAULT 1,
  scoring_type VARCHAR(50) DEFAULT 'normal', -- point or normal
  point_per_match INT,
  normal_scoring_rule VARCHAR(50), -- first_to_4, best_of_3, etc.
  knockout_setting INT, -- 4, 8, 16, 32
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create tournament_players table (enrollment and standings for tournaments)
CREATE TABLE tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_name VARCHAR(255), -- For Group Stage
  points INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- 5. Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INT,
  match_type VARCHAR(50) DEFAULT 'team', -- 'team' or 'individual'
  
  -- For team-based matches (Liga/Direct Match)
  team1_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team2_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  
  -- For individual-based matches (Americano/Mexicano/Knockout)
  team1_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team1_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team2_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team2_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
  
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed
  winner_id UUID, -- Can be Team ID or Player ID (for Individual 1v1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create match_scores table for detailed scoring
CREATE TABLE match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number INT NOT NULL, -- 1, 2, 3
  game_number INT NOT NULL, -- 1-6 (or more with deuce)
  team1_points INT DEFAULT 0,
  team2_points INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, set_number, game_number)
);

-- 7. Create standings table for Global Team rankings
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  sets_won INT DEFAULT 0,
  sets_lost INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_scores_match_id ON match_scores(match_id);
CREATE INDEX idx_tp_tournament_id ON tournament_players(tournament_id);
CREATE INDEX idx_tp_player_id ON tournament_players(player_id);

-- Sample Data (Optional)
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2b$10$YourHashedPasswordHere'); -- Note: Replace with actual hash if needed
