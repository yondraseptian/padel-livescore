// VERSION: 2026-04-28-02
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
  let playersArr = tpData.map(tp => tp.player_id);
  if (playersArr.length < 4 || playersArr.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4 for an Americano round.');
  }
  playersArr = shuffleArray(playersArr);
  const matchesToInsert = [];
  for (let i = 0; i < playersArr.length; i += 4) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: playersArr[i],
      team1_player2_id: playersArr[i + 1],
      team2_player1_id: playersArr[i + 2],
      team2_player2_id: playersArr[i + 3],
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
  const teamsList = tpData.map(tp => tp.player_id);
  if (teamsList.length < 2 || teamsList.length % 2 !== 0) {
    throw new Error('Number of teams must be a multiple of 2.');
  }
  const shuffledTeamsList = shuffleArray(teamsList);
  const matchesToInsert = [];
  for (let i = 0; i < shuffledTeamsList.length; i += 2) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: shuffledTeamsList[i],
      team1_player2_id: null,
      team2_player1_id: shuffledTeamsList[i + 1],
      team2_player2_id: null,
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
  
  let playersList: string[] = tpData.map(tp => tp.player_id);
  if (playersList.length < 4 || playersList.length % 4 !== 0) {
    throw new Error('Number of players must be a multiple of 4.');
  }

  // Round 1 is random
  if (roundNumber === 1) {
    playersList = shuffleArray(playersList);
  } else {
    // Shuffle within same point groups for variety
    const groupedByPoints: Record<number, string[]> = {};
    tpData.forEach(p => {
      const ptsValue = p.points || 0;
      if (!groupedByPoints[ptsValue]) groupedByPoints[ptsValue] = [];
      groupedByPoints[ptsValue].push(p.player_id);
    });

    const sortedPts = Object.keys(groupedByPoints).map(Number).sort((a, b) => b - a);
    playersList = [];
    sortedPts.forEach(pts => {
      playersList.push(...shuffleArray(groupedByPoints[pts]));
    });
  }

  // Create a point map for quick lookup
  const pointMapObj: Record<string, number> = {};
  tpData.forEach(tp => {
    pointMapObj[tp.player_id] = tp.points || 0;
  });

  const matchesToInsert: any[] = [];
  for (let i = 0; i < playersList.length; i += 4) {
    const p1 = playersList[i];
    const p2 = playersList[i + 1];
    const p3 = playersList[i + 2];
    const p4 = playersList[i + 3];

    const pt1 = pointMapObj[p1];
    const pt2 = pointMapObj[p2];
    const pt3 = pointMapObj[p3];
    const pt4 = pointMapObj[p4];

    // Evaluate two main Mexicano pairing options:
    // Option A: (P1 + P4) vs (P2 + P3)
    // Option B: (P1 + P3) vs (P2 + P4)
    
    const countAValue = (pt1 === pt4 ? 1 : 0) + (pt2 === pt3 ? 1 : 0);
    const countBValue = (pt1 === pt3 ? 1 : 0) + (pt2 === pt4 ? 1 : 0);

    let t1_id: string[] = [];
    let t2_id: string[] = [];

    // Pick the option with fewer same-point teammates
    if (countBValue < countAValue) {
      t1_id = [p1, p3];
      t2_id = [p2, p4];
    } else if (countAValue < countBValue) {
      t1_id = [p1, p4];
      t2_id = [p2, p3];
    } else {
      // If equal, prefer A (traditional) UNLESS pt2 === pt3, then try to break it
      if (pt2 === pt3 && pt2 !== pt4) {
        t1_id = [p1, p3];
        t2_id = [p2, p4];
      } else {
        t1_id = [p1, p4];
        t2_id = [p2, p3];
      }
    }

    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: t1_id[0],
      team1_player2_id: t1_id[1],
      team2_player1_id: t2_id[0],
      team2_player2_id: t2_id[1],
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
    .order('points', { ascending: false });
    
  if (tpError) throw new Error(`Failed to fetch tournament players: ${tpError.message}`);
  if (tpData.length < 2 || tpData.length % 2 !== 0) {
    throw new Error('Number of teams must be a multiple of 2.');
  }

  let finalTeamsList = [];
  if (roundNumber === 1) {
    finalTeamsList = shuffleArray(tpData.map(tp => tp.player_id));
  } else {
    // Shuffle within same point groups for variety
    const groupedByPoints: Record<number, string[]> = {};
    tpData.forEach(p => {
      const ptsValue = p.points || 0;
      if (!groupedByPoints[ptsValue]) groupedByPoints[ptsValue] = [];
      groupedByPoints[ptsValue].push(p.player_id);
    });

    const sortedPtsList = Object.keys(groupedByPoints).map(Number).sort((a, b) => b - a);
    sortedPtsList.forEach(pts => {
      finalTeamsList.push(...shuffleArray(groupedByPoints[pts]));
    });
  }

  const matchesToInsert = [];
  for (let i = 0; i < finalTeamsList.length; i += 2) {
    matchesToInsert.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      match_type: 'individual',
      team1_player1_id: finalTeamsList[i],
      team1_player2_id: null,
      team2_player1_id: finalTeamsList[i + 1],
      team2_player2_id: null,
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

  const grMap: Record<string, string[]> = {};
  tpData?.forEach(tp => {
    const groupNameStr = tp.group_name || 'Group A';
    if (!grMap[groupNameStr]) grMap[groupNameStr] = [];
    grMap[groupNameStr].push(tp.player_id);
  });

  const matchesToInsert: any[] = [];
  Object.values(grMap).forEach(participants => {
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
  const totalTeamsCount = participants.length;
  
  // Validate power of 2 (4, 8, 16, 32...)
  if (totalTeamsCount < 2 || (totalTeamsCount & (totalTeamsCount - 1)) !== 0) {
    throw new Error('Jumlah tim harus pangkat 2 (2, 4, 8, 16, 32) untuk sistem knockout otomatis.');
  }

  // Shuffle round 1
  const shuffledArr = shuffleArray(participants);
  const allMatchesToInsert = [];
  
  // 1. Generate Round 1
  let currentRoundParticipantsList = shuffledArr;
  let matchesInRoundCount = totalTeamsCount / 2;
  let rNum = 1;
  
  // Store round 1 matches first to keep track
  for (let i = 0; i < currentRoundParticipantsList.length; i += 2) {
    allMatchesToInsert.push({
      tournament_id: tournamentId,
      round_number: rNum,
      match_type: 'individual',
      team1_player1_id: currentRoundParticipantsList[i],
      team2_player1_id: currentRoundParticipantsList[i + 1],
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: 'scheduled'
    });
  }

  // 2. Generate future rounds as placeholders
  let prevRoundMatchesCount = matchesInRoundCount;
  while (prevRoundMatchesCount > 1) {
    rNum++;
    prevRoundMatchesCount = prevRoundMatchesCount / 2;
    for (let i = 0; i < prevRoundMatchesCount; i++) {
      allMatchesToInsert.push({
        tournament_id: tournamentId,
        round_number: rNum,
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

  const matchIdx = roundMatches.findIndex(m => m.id === matchId);
  if (matchIdx === -1) return;

  // 3. Find the next match in the next round
  const nextRnd = round_number + 1;
  const nextMatchIdx = Math.floor(matchIdx / 2);
  const isTeam2Side = matchIdx % 2 === 1;

  // Fetch matches of next round
  const { data: nextRoundMatches, error: nrError } = await supabaseServer
    .from('matches')
    .select('id')
    .eq('tournament_id', tournament_id)
    .eq('round_number', nextRnd)
    .order('created_at', { ascending: true });

  if (nrError || !nextRoundMatches || !nextRoundMatches[nextMatchIdx]) return;

  const nextMatchIdStr = nextRoundMatches[nextMatchIdx].id;

  // 4. Update the next match with the winner
  const updData: any = {};
  if (isTeam2Side) {
    updData.team2_player1_id = winnerId;
  } else {
    updData.team1_player1_id = winnerId;
  }

  await supabaseServer
    .from('matches')
    .update(updData)
    .eq('id', nextMatchIdStr);
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

export async function deleteTournament(tournamentId: string): Promise<void> {
  const { error } = await supabaseServer
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);
  if (error) throw new Error(`Failed to delete tournament: ${error.message}`);
}
