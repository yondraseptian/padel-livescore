import { supabaseServer } from './db';
import { Player, Tournament, TournamentPlayer, Match } from './db';

// Create a new tournament
export async function createTournament(
  name: string, 
  format: string,
  gameType: string,
  tournamentDate: string,
  numberOfCourts: number,
  scoringType: string,
  pointPerMatch: number | null,
  normalScoringRule: string | null,
  playersList: string[]
): Promise<Tournament> {
  const { data, error } = await supabaseServer
    .from('tournaments')
    .insert([{ 
      name, 
      format, 
      status: 'draft',
      game_type: gameType,
      tournament_date: tournamentDate ? new Date(tournamentDate).toISOString() : null,
      number_of_courts: numberOfCourts,
      scoring_type: scoringType,
      point_per_match: pointPerMatch,
      normal_scoring_rule: normalScoringRule
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create tournament: ${error.message}`);
  const tournamentId = data.id;

  // Add players if any
  if (playersList && playersList.length > 0) {
    const playerIds: string[] = [];
    
    // Check for existing players or create new ones
    for (const playerName of playersList) {
      if (!playerName.trim()) continue;
      
      const { data: existingPlayer } = await supabaseServer
        .from('players')
        .select('id')
        .eq('name', playerName.trim())
        .single();
        
      if (existingPlayer) {
        playerIds.push(existingPlayer.id);
      } else {
        const { data: newPlayer, error: pError } = await supabaseServer
          .from('players')
          .insert([{ name: playerName.trim() }])
          .select()
          .single();
          
        if (newPlayer && !pError) {
          playerIds.push(newPlayer.id);
        }
      }
    }
    
    // Enroll them into the tournament
    if (playerIds.length > 0) {
      await addPlayersToTournament(tournamentId, playerIds);
    }
  }

  return data;
}

// Add players to an individual tournament (Americano/Mexicano)
export async function addPlayersToTournament(tournamentId: string, playerIds: string[]): Promise<void> {
  const inserts = playerIds.map(id => ({
    tournament_id: tournamentId,
    player_id: id,
  }));

  const { error } = await supabaseServer
    .from('tournament_players')
    .insert(inserts);

  if (error) throw new Error(`Failed to add players: ${error.message}`);
}

// Generate the next round for an Americano tournament
export async function generateAmericanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  // Fetch players
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id')
    .eq('tournament_id', tournamentId);
    
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  
  let players = tpData.map(tp => tp.player_id);
  
  if (players.length < 4 || players.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4 for an Americano round.');
  }

  // Shuffle players (Simple random for now, a true Americano would use a round-robin schedule)
  players = players.sort(() => Math.random() - 0.5);

  const matchesToInsert = [];
  for (let i = 0; i < players.length; i += 4) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: players[i],
      team1_player2_id: players[i + 1],
      team2_player1_id: players[i + 2],
      team2_player2_id: players[i + 3],
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: 'scheduled'
    });
  }

  const { data, error } = await supabaseServer
    .from('matches')
    .insert(matchesToInsert)
    .select();

  if (error) throw new Error(`Failed to create matches: ${error.message}`);
  return data;
}

// Generate the next round for a Mexicano tournament
export async function generateMexicanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  // Fetch players ordered by points descending
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id, points')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false });
    
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  
  const players = tpData.map(tp => tp.player_id);
  
  if (players.length < 4 || players.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4 for a Mexicano round.');
  }

  const matchesToInsert = [];
  // Take top 4, next 4, etc.
  for (let i = 0; i < players.length; i += 4) {
    // Pairing: 1&4 vs 2&3 to balance the match
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: players[i],       // 1st
      team1_player2_id: players[i + 3],   // 4th
      team2_player1_id: players[i + 1],   // 2nd
      team2_player2_id: players[i + 2],   // 3rd
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: 'scheduled'
    });
  }

  const { data, error } = await supabaseServer
    .from('matches')
    .insert(matchesToInsert)
    .select();

  if (error) throw new Error(`Failed to create matches: ${error.message}`);
  return data;
}

// Start tournament
export async function startTournament(tournamentId: string): Promise<Tournament> {
  const { data, error } = await supabaseServer
    .from('tournaments')
    .update({ status: 'ongoing' })
    .eq('id', tournamentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to start tournament: ${error.message}`);
  return data;
}

// Create a new player
export async function createPlayer(name: string): Promise<Player> {
  const { data, error } = await supabaseServer
    .from('players')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create player: ${error.message}`);
  return data;
}

// Get all players
export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabaseServer
    .from('players')
    .select('*')
    .order('name');
    
  if (error) throw new Error(`Failed to fetch players: ${error.message}`);
  return data || [];
}

// Get all tournaments
export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabaseServer
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(`Failed to fetch tournaments: ${error.message}`);
  return data || [];
}
