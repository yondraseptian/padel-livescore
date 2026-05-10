import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';
import { calculateMatchState, getMatchScores } from '@/lib/match-service';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  return !!token;
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, team1Sets = 0, team2Sets = 0, team1Games = 0, team2Games = 0, team1Points = 0, team2Points = 0 } = await request.json();
    
    const { data: match } = await supabaseServer
      .from('matches')
      .select('*, tournament:tournament_id(*)')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Clear old scores to reconstruct the exact state requested
    await supabaseServer.from('match_scores').delete().eq('match_id', matchId);

    const scoresToInsert = [];
    let currentSetNum = 1;

    // 1. Reconstruct completed sets for Team 1
    for (let i = 0; i < team1Sets; i++) {
      for (let g = 1; g <= 6; g++) {
        scoresToInsert.push({
          match_id: matchId, set_number: currentSetNum, game_number: g,
          team1_points: 4, team2_points: 0, updated_at: new Date().toISOString()
        });
      }
      currentSetNum++;
    }

    // 2. Reconstruct completed sets for Team 2
    for (let i = 0; i < team2Sets; i++) {
      for (let g = 1; g <= 6; g++) {
        scoresToInsert.push({
          match_id: matchId, set_number: currentSetNum, game_number: g,
          team1_points: 0, team2_points: 4, updated_at: new Date().toISOString()
        });
      }
      currentSetNum++;
    }

    // 3. Reconstruct games in the current set
    let currentGameNum = 1;
    for (let i = 0; i < team1Games; i++) {
      scoresToInsert.push({
        match_id: matchId, set_number: currentSetNum, game_number: currentGameNum++,
        team1_points: 4, team2_points: 0, updated_at: new Date().toISOString()
      });
    }
    for (let i = 0; i < team2Games; i++) {
      scoresToInsert.push({
        match_id: matchId, set_number: currentSetNum, game_number: currentGameNum++,
        team1_points: 0, team2_points: 4, updated_at: new Date().toISOString()
      });
    }

    // 4. Reconstruct points in the current game
    if (team1Points > 0 || team2Points > 0 || scoresToInsert.length === 0) {
      scoresToInsert.push({
        match_id: matchId, set_number: currentSetNum, game_number: currentGameNum,
        team1_points: team1Points, team2_points: team2Points, updated_at: new Date().toISOString()
      });
    }

    const { error: insertError } = await supabaseServer.from('match_scores').insert(scoresToInsert);
    if (insertError) throw insertError;

    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores, match.tournament);

    // Update match status based on state
    if (matchState.matchComplete && matchState.winner) {
      const { updateMatchStatus } = await import('@/lib/match-service');
      
      // Update match status to completed
      let winnerId = matchState.winner === 'team1' ? match.team1_id : matchState.winner === 'team2' ? match.team2_id : null;
      
      // For knockout/group stage where team is stored in player1_id
      if (match.match_type === 'individual' && !winnerId) {
        winnerId = matchState.winner === 'team1' ? match.team1_player1_id : match.team2_player1_id;
      }

      await updateMatchStatus(matchId, 'completed', winnerId || undefined);

      if (match.tournament_id && match.match_type === 'individual') {
        // Update individual standings for Americano/Mexicano
        const { updateTournamentPlayerStandings } = await import('@/lib/match-service');
        
        let t1Score = matchState.team1Sets;
        let t2Score = matchState.team2Sets;
        
        if (matchState.isPointScoring) {
          t1Score = matchState.currentGame.team1Points;
          t2Score = matchState.currentGame.team2Points;
        } else {
          // Calculate total games won for standard tie-breakers
          t1Score = matchState.allSets.reduce((sum, s) => sum + s.team1Games, 0);
          t2Score = matchState.allSets.reduce((sum, s) => sum + s.team2Games, 0);
        }

        await updateTournamentPlayerStandings(
          match.tournament_id,
          match.team1_player1_id,
          match.team1_player2_id,
          match.team2_player1_id,
          match.team2_player2_id,
          matchState.winner as any,
          t1Score,
          t2Score
        );
      } else {
        // Update team standings
        const { updateStandings } = await import('@/lib/match-service');
        await updateStandings(
          match.team1_id,
          match.team2_id,
          matchState.winner,
          matchState.team1Sets,
          matchState.team2Sets
        );
      }

      // Auto-advance for Knockout
      const { data: tourney } = await supabaseServer.from('tournaments').select('format').eq('id', match.tournament_id).single();
      if (tourney?.format === 'knockout' && winnerId) {
        const { advanceKnockoutWinner } = await import('@/lib/tournament-service');
        await advanceKnockoutWinner(matchId, winnerId);
      }
    } else {
      // Only set to live if not yet completed and not finishing now
      const { updateMatchStatus } = await import('@/lib/match-service');
      if (match.status !== 'completed') {
        await updateMatchStatus(matchId, 'live');
      }
    }

    return NextResponse.json({ matchState });
  } catch (error: any) {
    console.error('Manual score update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
