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
  playersList: string[],
  knockoutSetting?: number | null,
  groups?: { name: string, teams: string[] }[] | null
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
      normal_scoring_rule: normalScoringRule,
      knockout_setting: knockoutSetting
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create tournament: ${error.message}`);
  const tournamentId = data.id;

  // Handle Group Stage Enrollment
  if (format === 'group_stage' && groups && groups.length > 0) {
    for (const group of groups) {
      for (const teamName of group.teams) {
        if (!teamName.trim()) continue;
        
        // Find or create player (team)
        let playerId;
        const { data: existingPlayer } = await supabaseServer
          .from('players')
          .select('id')
          .eq('name', teamName.trim())
          .single();
          
        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else {
          const { data: newPlayer } = await supabaseServer
            .from('players')
            .insert([{ name: teamName.trim() }])
            .select()
            .single();
          playerId = newPlayer.id;
        }

        // Enroll with group name
        await supabaseServer
          .from('tournament_players')
          .insert([{
            tournament_id: tournamentId,
            player_id: playerId,
            group_name: group.name
          }]);
      }
    }
  } else if (playersList && playersList.length > 0) {
    // Standard Enrollment
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

export async function generateGroupStageRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id, group_name')
    .eq('tournament_id', tournamentId);

  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);

  const groupsMap: Record<string, string[]> = {};
  tpData?.forEach(tp => {
    const group = tp.group_name || 'Group A';
    if (!groupsMap[group]) groupsMap[group] = [];
    groupsMap[group].push(tp.player_id);
  });

  const matchesToInsert: any[] = [];
  Object.values(groupsMap).forEach(participants => {
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matchesToInsert.push({
          tournament_id: tournamentId,
          round_number: roundNumber,
          match_type: 'individual',
          team1_player1_id: participants[i],
          team1_player2_id: null,
          team2_player1_id: participants[j],
          team2_player2_id: null,
          scheduled_at: scheduledAt || new Date().toISOString(),
          status: 'scheduled'
        });
      }
    }
  });

  const { data, error } = await supabaseServer.from('matches').insert(matchesToInsert).select();
  if (error) throw new Error(`Failed to create group stage matches: ${error.message}`);
  return data;
}

export async function generateKnockoutRound(tournamentId: string, roundNumber: number, scheduledAt?: string): Promise<Match[]> {
  // Always work from Round 1 to build the full bracket
  if (roundNumber !== 1) {
    throw new Error('Knockout bracket must be initialized from Round 1.');
  }

  // Fetch all teams
  const { data: tpData, error: tpError } = await supabaseServer
    .from('tournament_players')
    .select('player_id')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  
  const participants = tpData.map(tp => tp.player_id);
  const totalTeams = participants.length;
  
  // Validate power of 2 (4, 8, 16, 32...)
  if (totalTeams < 2 || (totalTeams & (totalTeams - 1)) !== 0) {
    throw new Error('Jumlah tim harus pangkat 2 (2, 4, 8, 16, 32) untuk sistem knockout otomatis.');
  }

  // Shuffle round 1
  const shuffled = shuffleArray(participants);
  const allMatchesToInsert = [];
  
  // 1. Generate Round 1
  let currentRoundParticipants = shuffled;
  let matchesInRound = totalTeams / 2;
  let r = 1;
  
  // Store round 1 matches first to keep track
  for (let i = 0; i < currentRoundParticipants.length; i += 2) {
    allMatchesToInsert.push({
      tournament_id: tournamentId,
      round_number: r,
      match_type: 'individual',
      team1_player1_id: currentRoundParticipants[i],
      team2_player1_id: currentRoundParticipants[i + 1],
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: 'scheduled'
    });
  }

  // 2. Generate future rounds as placeholders
  let prevRoundMatches = matchesInRound;
  while (prevRoundMatches > 1) {
    r++;
    prevRoundMatches = prevRoundMatches / 2;
    for (let i = 0; i < prevRoundMatches; i++) {
      allMatchesToInsert.push({
        tournament_id: tournamentId,
        round_number: r,
        match_type: 'individual',
        team1_player1_id: null,
        team2_player1_id: null,
        scheduled_at: scheduledAt || new Date().toISOString(),
        status: 'scheduled'
      });
    }
  }

  const { data, error } = await supabaseServer.from('matches').insert(allMatchesToInsert).select();
  if (error) throw new Error(`Failed to create knockout bracket: ${error.message}`);
  return data;
}

export async function advanceKnockoutWinner(matchId: string, winnerId: string): Promise<void> {
  // 1. Fetch current match info
  const { data: currentMatch, error: mError } = await supabaseServer
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (mError || !currentMatch) return;

  const { tournament_id, round_number } = currentMatch;

  // 2. Fetch all matches in this round to find the position
  const { data: roundMatches, error: rError } = await supabaseServer
    .from('matches')
    .select('id')
    .eq('tournament_id', tournament_id)
    .eq('round_number', round_number)
    .order('created_at', { ascending: true });

  if (rError || !roundMatches) return;

  const matchIndex = roundMatches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) return;

  // 3. Find the next match in the next round
  const nextRound = round_number + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isTeam2 = matchIndex % 2 === 1;

  // Fetch matches of next round
  const { data: nextRoundMatches, error: nrError } = await supabaseServer
    .from('matches')
    .select('id')
    .eq('tournament_id', tournament_id)
    .eq('round_number', nextRound)
    .order('created_at', { ascending: true });

  if (nrError || !nextRoundMatches || !nextRoundMatches[nextMatchIndex]) return;

  const nextMatchId = nextRoundMatches[nextMatchIndex].id;

  // 4. Update the next match with the winner
  const updateData: any = {};
  if (isTeam2) {
    updateData.team2_player1_id = winnerId;
  } else {
    updateData.team1_player1_id = winnerId;
  }

  await supabaseServer
    .from('matches')
    .update(updateData)
    .eq('id', nextMatchId);
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
