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
  winner?: 'team1' | 'team2' | 'draw';
  isTiebreaker?: boolean;
}

export interface MatchGameState {
  team1Sets: number;
  team2Sets: number;
  currentSet: SetScore;
  allSets: SetScore[];
  matchComplete: boolean;
  winner?: 'team1' | 'team2' | 'draw';
  isPointScoring?: boolean;
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

export interface TournamentConfig {
  scoring_type?: string;
  point_per_match?: number;
  normal_scoring_rule?: string;
}

function isSetTiebreaker(team1Games: number, team2Games: number, normalScoringRule?: string): boolean {
  if (!normalScoringRule) return team1Games === 6 && team2Games === 6;
  if (normalScoringRule.includes('total_of_')) return false;
  
  if (normalScoringRule === 'first_to_3') return team1Games === 2 && team2Games === 2;
  if (normalScoringRule === 'first_to_4') return team1Games === 3 && team2Games === 3;
  if (normalScoringRule === 'first_to_5') return team1Games === 4 && team2Games === 4;
  if (normalScoringRule === 'first_to_6') return team1Games === 5 && team2Games === 5;
  if (normalScoringRule === 'first_to_7') return team1Games === 6 && team2Games === 6;
  
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
export function calculateMatchState(scores: MatchScore[], config?: TournamentConfig): MatchGameState {
  // Sort scores sequentially
  const sortedScores = [...scores].sort((a, b) => {
    if (a.set_number !== b.set_number) return a.set_number - b.set_number;
    return a.game_number - b.game_number;
  });

  const isPointScoring = config?.scoring_type === 'point';
  const pointLimit = config?.point_per_match || 16;
  
  // Point Scoring Logic
  if (isPointScoring) {
    let t1Pts = 0;
    let t2Pts = 0;
    
    // In point scoring, there is only set 1, game 1 conceptually, or we just sum the latest points
    if (sortedScores.length > 0) {
      const latestScore = sortedScores[sortedScores.length - 1];
      t1Pts = latestScore.team1_points;
      t2Pts = latestScore.team2_points;
    }
    
    const totalPoints = t1Pts + t2Pts;
    const matchComplete = totalPoints >= pointLimit;
    
    let matchWinner: 'team1' | 'team2' | 'draw' | undefined = undefined;
    if (matchComplete) {
      if (t1Pts > t2Pts) matchWinner = 'team1';
      else if (t2Pts > t1Pts) matchWinner = 'team2';
      else matchWinner = 'draw';
    }

    return {
      team1Sets: 0,
      team2Sets: 0,
      currentSet: { team1Games: 0, team2Games: 0, isComplete: matchComplete, winner: matchWinner === 'draw' ? undefined : matchWinner },
      allSets: [{ team1Games: 0, team2Games: 0, isComplete: matchComplete }],
      matchComplete,
      winner: matchWinner,
      isPointScoring: true,
      currentGame: {
        team1Points: t1Pts,
        team2Points: t2Pts
      }
    };
  }

  // Normal Scoring Logic (Games & Sets)
  let targetGames = 6;
  const rule = config?.normal_scoring_rule;
  if (rule) {
    if (rule.includes('3')) targetGames = 3;
    if (rule.includes('4')) targetGames = 4;
    if (rule.includes('5')) targetGames = 5;
    if (rule.includes('6')) targetGames = 6;
    if (rule.includes('7')) targetGames = 7;
  }

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
    
    const isTiebreaker = isSetTiebreaker(set.team1Games, set.team2Games, rule);
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
        if (rule?.includes('total_of_')) {
          if (set.team1Games + set.team2Games >= targetGames) {
            set.isComplete = true;
            if (set.team1Games > set.team2Games) set.winner = 'team1';
            else if (set.team2Games > set.team1Games) set.winner = 'team2';
            else set.winner = 'draw';
          }
        } else {
          if (set.team1Games >= targetGames && set.team1Games - set.team2Games >= 2) {
            set.isComplete = true;
            set.winner = 'team1';
          } else if (set.team2Games >= targetGames && set.team2Games - set.team1Games >= 2) {
            set.isComplete = true;
            set.winner = 'team2';
          } else if (set.team1Games === targetGames + 1) { // e.g. 7-5
            set.isComplete = true;
            set.winner = 'team1';
          } else if (set.team2Games === targetGames + 1) {
            set.isComplete = true;
            set.winner = 'team2';
          }
        }
      }

      if (set.isComplete) {
        if (set.winner === 'team1') team1SetsWon++;
        if (set.winner === 'team2') team2SetsWon++;
      }

      currentGameTeam1Points = 0;
      currentGameTeam2Points = 0;
    } else {
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

  // Check if "Total of" rule means they only play exactly the target number of sets?
  // If there's a specific normal_scoring_rule, we assume it's a 1-set tournament match.
  // Otherwise, standard matches are Best of 3 sets.
  const targetSetsWon = rule ? 1 : 2;
  const matchComplete = Boolean(team1SetsWon === targetSetsWon || team2SetsWon === targetSetsWon || (rule?.includes('total_of_') && sets[1].isComplete));
  const matchWinner = team1SetsWon > team2SetsWon ? 'team1' : team2SetsWon > team1SetsWon ? 'team2' : sets[1].winner;

  sets[activeSetNum].isTiebreaker = isSetTiebreaker(sets[activeSetNum].team1Games, sets[activeSetNum].team2Games, rule);

  return {
    team1Sets: team1SetsWon,
    team2Sets: team2SetsWon,
    currentSet: sets[activeSetNum],
    allSets: [sets[1], sets[2], sets[3]].filter(s => s.team1Games > 0 || s.team2Games > 0 || s === sets[activeSetNum]),
    matchComplete,
    winner: matchWinner,
    isPointScoring: false,
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
  team1Id: string | undefined,
  team2Id: string | undefined,
  matchWinner: 'team1' | 'team2' | 'draw',
  team1SetsWon: number,
  team2SetsWon: number
): Promise<void> {
  try {
    if (!team1Id || !team2Id) return;

    if (matchWinner === 'draw') {
      // Both teams get 1 match played, maybe a draw stat? 
      // We don't have a draws column, so just update matches_played
      const allTeams = [team1Id, team2Id];
      for (const tId of allTeams) {
        await supabaseServer
          .from('standings')
          .update({
            matches_played: supabaseServer.from('standings').select('matches_played').eq('team_id', tId),
            updated_at: new Date().toISOString(),
          })
          .eq('team_id', tId);
      }
      return;
    }

    const winnerTeamId = matchWinner === 'team1' ? team1Id : team2Id;
    const loserTeamId = matchWinner === 'team1' ? team2Id : team1Id;

    // Update winner
    await supabaseServer
      .from('standings')
      .update({
        matches_played: supabaseServer.from('standings').select('matches_played').eq('team_id', winnerTeamId),
        matches_won: supabaseServer.from('standings').select('matches_won').eq('team_id', winnerTeamId).then((r) => (r.data?.[0]?.matches_won || 0) + 1),
        sets_won: team1SetsWon === 2 ? 2 : 1, // Note: not quite right for point scoring, but works for normal
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', winnerTeamId);

    // Update loser
    await supabaseServer
      .from('standings')
      .update({
        matches_played: supabaseServer.from('standings').select('matches_played').eq('team_id', loserTeamId),
        matches_lost: supabaseServer.from('standings').select('matches_lost').eq('team_id', loserTeamId).then((r) => (r.data?.[0]?.matches_lost || 0) + 1),
        sets_lost: team1SetsWon === 2 ? 2 : 1, // Ditto
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', loserTeamId);
  } catch (error) {
    console.error('Update standings error:', error);
  }
}

// Update tournament player standings for individual formats
export async function updateTournamentPlayerStandings(
  tournamentId: string,
  team1Player1Id: string | undefined,
  team1Player2Id: string | undefined,
  team2Player1Id: string | undefined,
  team2Player2Id: string | undefined,
  matchWinner: 'team1' | 'team2' | 'draw',
  team1Score: number = 0,
  team2Score: number = 0
): Promise<void> {
  try {
    const updatePlayerStats = async (pId: string | undefined, isWin: boolean, isDraw: boolean, pointsWon: number, pointsLost: number) => {
      if (!pId) return;
      const { data } = await supabaseServer.from('tournament_players').select('*').eq('tournament_id', tournamentId).eq('player_id', pId).single();
      if (data) {
        let newPoints = data.points;
        if (isWin) newPoints += 3;
        else if (isDraw) newPoints += 1;

        await supabaseServer.from('tournament_players').update({
          points: newPoints,
          matches_played: data.matches_played + 1,
          matches_won: isWin ? data.matches_won + 1 : data.matches_won,
          matches_lost: (!isWin && !isDraw) ? data.matches_lost + 1 : data.matches_lost,
          games_won: data.games_won + pointsWon,
          games_lost: data.games_lost + pointsLost,
        }).eq('tournament_id', tournamentId).eq('player_id', pId);
      }
    };

    const isDraw = matchWinner === 'draw';
    
    // Team 1 players
    await updatePlayerStats(team1Player1Id, matchWinner === 'team1', isDraw, team1Score, team2Score);
    await updatePlayerStats(team1Player2Id, matchWinner === 'team1', isDraw, team1Score, team2Score);

    // Team 2 players
    await updatePlayerStats(team2Player1Id, matchWinner === 'team2', isDraw, team2Score, team1Score);
    await updatePlayerStats(team2Player2Id, matchWinner === 'team2', isDraw, team2Score, team1Score);

  } catch (error) {
    console.error('Update tournament player standings error:', error);
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
      team2:team2_id(id, name, logo_url),
      team1_player1:team1_player1_id(id, name),
      team1_player2:team1_player2_id(id, name),
      team2_player1:team2_player1_id(id, name),
      team2_player2:team2_player2_id(id, name),
      tournament:tournament_id(status)
    `
    )
    .in('status', ['scheduled', 'live', 'completed'])
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }

  return (data || []).filter((m: any) => !m.tournament || m.tournament.status !== 'completed');
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
