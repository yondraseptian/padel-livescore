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
  isTiebreaker?: boolean;
}

export interface MatchGameState {
  team1Sets: number;
  team2Sets: number;
  currentSet: SetScore;
  allSets: SetScore[];
  matchComplete: boolean;
  winner?: 'team1' | 'team2';
  currentGame: {
    team1Points: number;
    team2Points: number;
  };
}

export function getTennisScoreDisplay(teamPoints: number, oppPoints: number, isTiebreaker: boolean = false): string {
  if (isTiebreaker) {
    return teamPoints.toString();
  }
  
  if (teamPoints >= 3 && oppPoints >= 3) {
    if (teamPoints === oppPoints) return '40'; // Deuce
    if (teamPoints > oppPoints) return 'AD';
    return '40'; // Opponent has AD
  }

  const scoreMap = ['0', '15', '30', '40'];
  return scoreMap[teamPoints] || '40';
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

// Helper to determine if a set is a tiebreaker
function isSetTiebreaker(team1Games: number, team2Games: number): boolean {
  return team1Games === 6 && team2Games === 6;
}

// Helper to determine if a game is won
function isGameWon(team1Points: number, team2Points: number, isTiebreaker: boolean): 'team1' | 'team2' | null {
  if (isTiebreaker) {
    if (team1Points >= 7 && team1Points - team2Points >= 2) return 'team1';
    if (team2Points >= 7 && team2Points - team1Points >= 2) return 'team2';
  } else {
    if (team1Points >= 4 && team1Points - team2Points >= 2) return 'team1';
    if (team2Points >= 4 && team2Points - team1Points >= 2) return 'team2';
  }
  return null;
}

// Calculate current match state from all scores
export function calculateMatchState(scores: MatchScore[]): MatchGameState {
  // Sort scores sequentially
  const sortedScores = [...scores].sort((a, b) => {
    if (a.set_number !== b.set_number) return a.set_number - b.set_number;
    return a.game_number - b.game_number;
  });

  const sets: Record<number, SetScore> = {
    1: { team1Games: 0, team2Games: 0, isComplete: false },
    2: { team1Games: 0, team2Games: 0, isComplete: false },
    3: { team1Games: 0, team2Games: 0, isComplete: false },
  };

  let team1SetsWon = 0;
  let team2SetsWon = 0;

  let currentGameTeam1Points = 0;
  let currentGameTeam2Points = 0;

  for (const score of sortedScores) {
    const set = sets[score.set_number];
    if (!set || set.isComplete) continue;
    
    // Check if this game is a tiebreaker
    const isTiebreaker = isSetTiebreaker(set.team1Games, set.team2Games);
    set.isTiebreaker = isTiebreaker;

    const gameWinner = isGameWon(score.team1_points, score.team2_points, isTiebreaker);
    
    if (gameWinner) {
      if (gameWinner === 'team1') set.team1Games++;
      if (gameWinner === 'team2') set.team2Games++;

      // Check if set is won
      if (isTiebreaker) {
        set.isComplete = true;
        set.winner = gameWinner;
      } else {
        if (set.team1Games >= 6 && set.team1Games - set.team2Games >= 2) {
          set.isComplete = true;
          set.winner = 'team1';
        } else if (set.team2Games >= 6 && set.team2Games - set.team1Games >= 2) {
          set.isComplete = true;
          set.winner = 'team2';
        } else if (set.team1Games === 7) {
          set.isComplete = true;
          set.winner = 'team1';
        } else if (set.team2Games === 7) {
          set.isComplete = true;
          set.winner = 'team2';
        }
      }

      if (set.isComplete) {
        if (set.winner === 'team1') team1SetsWon++;
        if (set.winner === 'team2') team2SetsWon++;
      }

      // Reset points for next game
      currentGameTeam1Points = 0;
      currentGameTeam2Points = 0;
    } else {
      // Game ongoing
      currentGameTeam1Points = score.team1_points;
      currentGameTeam2Points = score.team2_points;
    }
  }

  // Find active set
  let activeSetNum = 1;
  if (sets[1].isComplete) activeSetNum = 2;
  if (sets[2].isComplete && team1SetsWon < 2 && team2SetsWon < 2) activeSetNum = 3;
  if (team1SetsWon >= 2 || team2SetsWon >= 2) {
    if (sets[3].isComplete) activeSetNum = 3;
    else if (sets[2].isComplete) activeSetNum = 2;
    else activeSetNum = 1;
  }

  const matchComplete = team1SetsWon === 2 || team2SetsWon === 2;
  const matchWinner = team1SetsWon === 2 ? 'team1' : team2SetsWon === 2 ? 'team2' : undefined;

  sets[activeSetNum].isTiebreaker = isSetTiebreaker(sets[activeSetNum].team1Games, sets[activeSetNum].team2Games);

  return {
    team1Sets: team1SetsWon,
    team2Sets: team2SetsWon,
    currentSet: sets[activeSetNum],
    allSets: [sets[1], sets[2], sets[3]].filter(s => s.team1Games > 0 || s.team2Games > 0 || s === sets[activeSetNum]),
    matchComplete,
    winner: matchWinner,
    currentGame: {
      team1Points: matchComplete ? 0 : currentGameTeam1Points,
      team2Points: matchComplete ? 0 : currentGameTeam2Points
    }
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
