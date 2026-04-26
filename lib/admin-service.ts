import { supabaseServer } from './db';
import type { Team, Match } from './db';

// Create a new team
export async function createTeam(name: string, logoUrl?: string): Promise<Team | null> {
  try {
    // Check if team already exists to avoid unique constraint error
    const { data: existingTeam } = await supabaseServer
      .from('teams')
      .select('id')
      .ilike('name', name)
      .single();

    if (existingTeam) {
      throw new Error(`Team with name "${name}" already exists`);
    }

    // Insert new team
    const { data: team, error: insertError } = await supabaseServer
      .from('teams')
      .insert({ name, logo_url: logoUrl })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating team:', insertError);
      throw new Error('Failed to create team');
    }

    // Initialize standings for the new team
    const { error: standingsError } = await supabaseServer
      .from('standings')
      .insert({
        team_id: team.id,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        games_won: 0,
        games_lost: 0,
        sets_won: 0,
        sets_lost: 0
      });

    if (standingsError) {
      console.error('Error initializing standings:', standingsError);
      // We don't throw here to return the created team, but we log the error
    }

    return team;
  } catch (error) {
    console.error('createTeam error:', error);
    throw error;
  }
}

// Get all teams for selection
export async function getTeams(): Promise<Team[]> {
  try {
    const { data, error } = await supabaseServer
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getTeams error:', error);
    return [];
  }
}

// Create a new match
export async function createMatch(team1Id: string, team2Id: string, scheduledAt: string): Promise<Match | null> {
  try {
    if (team1Id === team2Id) {
      throw new Error('Team 1 and Team 2 must be different');
    }

    const { data, error } = await supabaseServer
      .from('matches')
      .insert({
        team1_id: team1Id,
        team2_id: team2Id,
        scheduled_at: scheduledAt,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      throw new Error('Failed to create match');
    }

    return data;
  } catch (error) {
    console.error('createMatch error:', error);
    throw error;
  }
}
