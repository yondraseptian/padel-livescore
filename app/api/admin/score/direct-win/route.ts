import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { cookies } from 'next/headers';
import { calculateMatchState, getMatchScores, updateMatchStatus } from '@/lib/match-service';

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
    const { matchId, winner } = await request.json();
    if (!matchId || !winner) {
      return NextResponse.json({ error: 'Missing matchId or winner' }, { status: 400 });
    }

    // 1. Fetch match and tournament config
    const { data: match } = await supabaseServer
      .from('matches')
      .select('*, tournament:tournament_id(*)')
      .eq('id', matchId)
      .single();

    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const tournament = match.tournament;
    const winnerId = winner === 'team1' ? (match.team1_id || match.team1_player1_id) : (match.team2_id || match.team2_player1_id);

    // 2. Set match to completed
    await updateMatchStatus(matchId, 'completed', winnerId);

    // 3. Update standings
    // For simplicity, we trigger the standings update by simulating a final score if none exists
    // Or we can call the service directly.
    const { updateTournamentPlayerStandings, updateStandings } = await import('@/lib/match-service');
    
    let t1Score = 0;
    let t2Score = 0;

    // Default "win" scores
    if (tournament.scoring_type === 'point') {
      const target = tournament.point_per_match || 32;
      t1Score = winner === 'team1' ? target : 0;
      t2Score = winner === 'team2' ? target : 0;
    } else {
      t1Score = winner === 'team1' ? 6 : 0;
      t2Score = winner === 'team2' ? 6 : 0;
    }

    if (match.match_type === 'individual') {
      await updateTournamentPlayerStandings(
        match.tournament_id,
        match.team1_player1_id,
        match.team1_player2_id,
        match.team2_player1_id,
        match.team2_player2_id,
        winner,
        t1Score,
        t2Score
      );
    } else {
      await updateStandings(match.team1_id, match.team2_id, winner, t1Score, t2Score);
    }

    // Auto-advance for Knockout
    if (tournament.format === 'knockout' && winnerId) {
      const { advanceKnockoutWinner } = await import('@/lib/tournament-service');
      await advanceKnockoutWinner(matchId, winnerId);
    }

    // 4. Return new state
    const scores = await getMatchScores(matchId);
    const matchState = calculateMatchState(scores, tournament);

    return NextResponse.json({ matchState });
  } catch (error: any) {
    console.error('Direct win error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
