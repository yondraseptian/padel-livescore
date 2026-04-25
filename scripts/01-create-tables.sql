-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS match_scores CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS standings CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_scores table for detailed scoring
-- Format: Best of 3 sets, each set 6 games, 2-point margin
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

-- Create standings table for leaderboard
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

-- Create admin_users table with hashed passwords
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_matches_team1_id ON matches(team1_id);
CREATE INDEX idx_matches_team2_id ON matches(team2_id);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_scores_match_id ON match_scores(match_id);
CREATE INDEX idx_standings_team_id ON standings(team_id);

-- Insert sample data for testing
INSERT INTO teams (name, logo_url) VALUES
  ('Team A', 'https://via.placeholder.com/100?text=Team+A'),
  ('Team B', 'https://via.placeholder.com/100?text=Team+B'),
  ('Team C', 'https://via.placeholder.com/100?text=Team+C'),
  ('Team D', 'https://via.placeholder.com/100?text=Team+D');

-- Insert sample matches
INSERT INTO matches (team1_id, team2_id, scheduled_at, status) 
SELECT 
  (SELECT id FROM teams WHERE name = 'Team A'),
  (SELECT id FROM teams WHERE name = 'Team B'),
  NOW() + INTERVAL '2 hours'::interval,
  'scheduled'
UNION ALL
SELECT 
  (SELECT id FROM teams WHERE name = 'Team C'),
  (SELECT id FROM teams WHERE name = 'Team D'),
  NOW() + INTERVAL '4 hours'::interval,
  'scheduled'
UNION ALL
SELECT 
  (SELECT id FROM teams WHERE name = 'Team A'),
  (SELECT id FROM teams WHERE name = 'Team C'),
  NOW() - INTERVAL '1 hours'::interval,
  'live';

-- Insert standings for each team
INSERT INTO standings (team_id, matches_played, matches_won, matches_lost, games_won, games_lost, sets_won, sets_lost)
SELECT id, 0, 0, 0, 0, 0, 0, 0 FROM teams;
