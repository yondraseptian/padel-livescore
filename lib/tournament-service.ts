"use server";

import { supabaseServer } from './db';
import { Player, Tournament, Match } from './db';

// Helper to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

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

  if (playersList && playersList.length > 0) {
    const playerIds: string[] = [];
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
    if (playerIds.length > 0) {
      await addPlayersToTournament(tournamentId, playerIds);
    }
  }
  return data;
}

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

export async function generateAmericanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id')
    .eq('tournament_id', tournamentId);
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  let players = tpData.map(tp => tp.player_id);
  if (players.length < 4 || players.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4 for an Americano round.');
  }
  players = shuffleArray(players);
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

export async function generateTeamAmericanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  const players = tpData.map(tp => tp.player_id);
  if (players.length < 4 || players.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4.');
  }
  const teams = [];
  for (let i = 0; i < players.length; i += 2) {
    teams.push({ p1: players[i], p2: players[i + 1] });
  }
  const shuffledTeams = shuffleArray(teams);
  const matchesToInsert = [];
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: shuffledTeams[i].p1,
      team1_player2_id: shuffledTeams[i].p2,
      team2_player1_id: shuffledTeams[i + 1].p1,
      team2_player2_id: shuffledTeams[i + 1].p2,
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

export async function generateMexicanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id, points')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false });
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  const players = tpData.map(tp => tp.player_id);
  if (players.length < 4 || players.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4.');
  }
  const matchesToInsert = [];
  for (let i = 0; i < players.length; i += 4) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: players[i],
      team1_player2_id: players[i + 3],
      team2_player1_id: players[i + 1],
      team2_player2_id: players[i + 2],
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

export async function generateTeamMexicanoRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id, points')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  if (tpData.length < 4 || tpData.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4.');
  }
  const teams = [];
  for (let i = 0; i < tpData.length; i += 2) {
    teams.push({ 
      p1: tpData[i].player_id, 
      p2: tpData[i+1].player_id,
      points: tpData[i].points + tpData[i+1].points
    });
  }
  const sortedTeams = teams.sort((a, b) => b.points - a.points);
  const matchesToInsert = [];
  for (let i = 0; i < sortedTeams.length; i += 2) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: sortedTeams[i].p1,
      team1_player2_id: sortedTeams[i].p2,
      team2_player1_id: sortedTeams[i + 1].p1,
      team2_player2_id: sortedTeams[i + 1].p2,
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

export async function createPlayer(name: string): Promise<Player> {
  const { data, error } = await supabaseServer
    .from('players')
    .insert([{ name }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create player: ${error.message}`);
  return data;
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabaseServer
    .from('players')
    .select('*')
    .order('name');
  if (error) throw new Error(`Failed to fetch players: ${error.message}`);
  return data || [];
}

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabaseServer
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch tournaments: ${error.message}`);
  return data || [];
}
