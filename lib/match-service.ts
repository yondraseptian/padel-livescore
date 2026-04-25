import { supabaseServer } from './db';
import type { Match, MatchScore, Standing } from './db';

/**
 * Padel scoring format:
 * - Best of 3 sets
 * - Each set won by first team to 6 games with 2+ game margin
 * - If 6-6, play tiebreaker (first to 7 points with 2+ margin)
 * - Win set = need 6 games minimum AND 2 game lead
 */

export interface SetScore {
  team1Games: number;
  team2Games: number;
  isComplete: boolean;
  winner?: 'team1' | 'team2';
}

export interface MatchGameState {
  team1Sets: number;
  team2Sets: number;
  currentSet: SetScore;
  allSets: SetScore[];
  matchComplete: boolean;
  winner?: 'team1' | 'team2';
}

// Get all match scores for a match
export async function getMatchScores(matchId: string): Promise<MatchScore[]> {
  const { data, error } = await supabaseServer
    .from('match_scores')
    .select('*')
    .eq('match_id', matchId)
    .order('set_number', { ascending: true })
    .order('game_number', { ascending: true });

  if (error) {
    console.error('Error fetching match scores:', error);
    return [];
  }

  return data || [];
}

// Calculate current match state from all scores
export function calculateMatchState(scores: MatchScore[]): MatchGameState {
  const setScores: Record<number, { team1: number; team2: number }> = {};
  const completedSets: SetScore[] = [];
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  // Group scores by set
  for (const score of scores) {
    if (!setScores[score.set_number]) {
      setScores[score.set_number] = { team1: 0, team2: 0 };
    }

    if (score.team1_points > setScores[score.set_number].team1) {
      setScores[score.set_number].team1 = score.team1_points;
    }
    if (score.team2_points > setScores[score.set_number].team2) {
      setScores[score.set_number].team2 = score.team2_points;
    }
  }

  // Determine set results
  for (const setNum of Object.keys(setScores).sort((a, b) => parseInt(a) - parseInt(b))) {
    const setNumber = parseInt(setNum);
    const { team1, team2 } = setScores[setNumber];

    // Check if set is complete
    let isComplete = false;
    let winner: 'team1' | 'team2' | undefined;

    if (team1 >= 6 && team1 - team2 >= 2) {
      isComplete = true;
      winner = 'team1';
      team1SetsWon++;
    } else if (team2 >= 6 && team2 - team1 >= 2) {
      isComplete = true;
      winner = 'team2';
      team2SetsWon++;
    } else if (team1 === 7 && team1 - team2 >= 2) {
      // Tiebreaker
      isComplete = true;
      winner = 'team1';
      team1SetsWon++;
    } else if (team2 === 7 && team2 - team1 >= 2) {
      // Tiebreaker
      isComplete = true;
      winner = 'team2';
      team2SetsWon++;
    }

    if (setNumber < 3) {
      completedSets.push({
        team1Games: team1,
        team2Games: team2,
        isComplete,
        winner,
      });
    }
  }

  // Current set is the last one
  const currentSetNum = Math.max(...Object.keys(setScores).map(Number), 1);
  const { team1: currentTeam1, team2: currentTeam2 } = setScores[currentSetNum] || { team1: 0, team2: 0 };

  let currentSetComplete = false;
  let currentSetWinner: 'team1' | 'team2' | undefined;

  if (currentTeam1 >= 6 && currentTeam1 - currentTeam2 >= 2) {
    currentSetComplete = true;
    currentSetWinner = 'team1';
  } else if (currentTeam2 >= 6 && currentTeam2 - currentTeam1 >= 2) {
    currentSetComplete = true;
    currentSetWinner = 'team2';
  } else if (currentTeam1 === 7 && currentTeam1 - currentTeam2 >= 2) {
    currentSetComplete = true;
    currentSetWinner = 'team1';
  } else if (currentTeam2 === 7 && currentTeam2 - currentTeam1 >= 2) {
    currentSetComplete = true;
    currentSetWinner = 'team2';
  }

  const currentSet: SetScore = {
    team1Games: currentTeam1,
    team2Games: currentTeam2,
    isComplete: currentSetComplete,
    winner: currentSetWinner,
  };

  // Determine match winner
  let matchComplete = false;
  let matchWinner: 'team1' | 'team2' | undefined;

  if (team1SetsWon === 2) {
    matchComplete = true;
    matchWinner = 'team1';
  } else if (team2SetsWon === 2) {
    matchComplete = true;
    matchWinner = 'team2';
  }

  return {
    team1Sets: team1SetsWon,
    team2Sets: team2SetsWon,
    currentSet,
    allSets: completedSets,
    matchComplete,
    winner: matchWinner,
  };
}

// Update score in database
export async function updateMatchScore(
  matchId: string,
  setNumber: number,
  gameNumber: number,
  team1Points: number,
  team2Points: number
): Promise<MatchScore | null> {
  try {
    const { data, error } = await supabaseServer
      .from('match_scores')
      .upsert(
        {
          match_id: matchId,
          set_number: setNumber,
          game_number: gameNumber,
          team1_points: team1Points,
          team2_points: team2Points,
        },
        { onConflict: 'match_id,set_number,game_number' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating match score:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Update match score error:', error);
    return null;
  }
}

// Reset match scores
export async function resetMatchScores(matchId: string): Promise<boolean> {
  try {
    // Delete all scores for the match
    const { error: deleteError } = await supabaseServer
      .from('match_scores')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) {
      console.error('Error resetting match scores:', deleteError);
      return false;
    }

    // Update match status back to scheduled and clear winner
    const { error: updateError } = await supabaseServer
      .from('matches')
      .update({ 
        status: 'scheduled', 
        winner_id: null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Error resetting match status:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Reset match scores error:', error);
    return false;
  }
}

// Update match status
export async function updateMatchStatus(
  matchId: string,
  status: 'scheduled' | 'live' | 'completed',
  winnerId?: string
): Promise<Match | null> {
  try {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (winnerId) {
      updateData.winner_id = winnerId;
    }

    const { data, error } = await supabaseServer
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating match status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Update match status error:', error);
    return null;
  }
}

// Update standings after match completion
export async function updateStandings(
  team1Id: string,
  team2Id: string,
  matchWinner: 'team1' | 'team2',
  team1SetsWon: number,
  team2SetsWon: number
): Promise<void> {
  try {
    const winnerTeamId = matchWinner === 'team1' ? team1Id : team2Id;
    const loserTeamId = matchWinner === 'team1' ? team2Id : team1Id;

    // Update winner
    await supabaseServer
      .from('standings')
      .update({
        matches_played: supabaseServer.from('standings').select('matches_played').eq('team_id', winnerTeamId),
        matches_won: supabaseServer.from('standings').select('matches_won').eq('team_id', winnerTeamId).then((r) => (r.data?.[0]?.matches_won || 0) + 1),
        sets_won: team1SetsWon === 2 ? 2 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', winnerTeamId);

    // Update loser
    await supabaseServer
      .from('standings')
      .update({
        matches_played: supabaseServer.from('standings').select('matches_played').eq('team_id', loserTeamId),
        matches_lost: supabaseServer.from('standings').select('matches_lost').eq('team_id', loserTeamId).then((r) => (r.data?.[0]?.matches_lost || 0) + 1),
        sets_lost: team1SetsWon === 2 ? 2 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', loserTeamId);
  } catch (error) {
    console.error('Update standings error:', error);
  }
}

// Get upcoming matches
export async function getUpcomingMatches(limit: number = 5): Promise<Match[]> {
  const { data, error } = await supabaseServer
    .from('matches')
    .select(
      `
      *,
      team1:team1_id(id, name, logo_url),
      team2:team2_id(id, name, logo_url)
    `
    )
    .in('status', ['scheduled', 'live'])
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }

  return data || [];
}

// Get standings
export async function getStandings(): Promise<any[]> {
  const { data, error } = await supabaseServer
    .from('standings')
    .select(
      `
      *,
      team:team_id(id, name, logo_url)
    `
    )
    .order('matches_won', { ascending: false })
    .order('sets_won', { ascending: false });

  if (error) {
    console.error('Error fetching standings:', error);
    return [];
  }

  return data || [];
}
