-- Alter tournaments table to add new fields
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game_type VARCHAR(50) DEFAULT 'tournament'; -- 'tournament' or 'mabar'
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_date DATE;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS number_of_courts INT DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS scoring_type VARCHAR(50) DEFAULT 'normal'; -- 'point' or 'normal'
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS point_per_match INT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS normal_scoring_rule VARCHAR(50);

-- Make sure format column can hold the new longer strings like 'team_americano'
ALTER TABLE tournaments ALTER COLUMN format TYPE VARCHAR(100);
